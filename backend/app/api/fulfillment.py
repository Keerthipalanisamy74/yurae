"""
Enterprise Order Fulfillment, WMS, Quality Control, Packing, Shipping Labels, Refunds, and Audit APIs
"""

import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import (
    Order, User, PickList, PickListItem, QualityCheckLog, PackingLog,
    RefundRecord, NotificationLog, AuditLog, Warehouse, ProductInventoryLocation
)
from app.schemas.schemas import (
    OrderResponse, OrderLifecycleResponse, FulfillmentAdvanceRequest,
    PickListResponse, PickItemRequest, PickListItemResponse,
    QualityCheckRequest, QualityCheckResponse,
    PackingRequest, PackingResponse,
    RefundRequestCreate, RefundResponse,
    NotificationLogResponse, AuditLogResponse,
    WarehouseCreate, WarehouseResponse, ProductInventoryLocationResponse, ProductInventoryLocationCreate
)
from app.api.deps import get_current_user, get_current_admin
from app.core.events import YuraeEventBus
from app.services.fulfillment_orchestrator import FulfillmentOrchestrator
from app.services.warehouse_service import WarehouseService
from app.services.qc_service import QCService
from app.services.packing_service import PackingService
from app.services.shipping_label_service import ShippingLabelService
from app.services.refund_service import RefundService

logger = logging.getLogger("yurae.fulfillment_api")

router = APIRouter(prefix="/fulfillment", tags=["Enterprise Fulfillment & WMS Lifecycle"])


# ==========================================
# LIFECYCLE & STATUS PROGRESSION
# ==========================================

@router.get("/orders/{order_id}/lifecycle", response_model=OrderLifecycleResponse)
def get_order_fulfillment_lifecycle(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Patron & Admin: Fetch full granular 18+ milestone progress stepper and timeline.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    if order.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized to view this order lifecycle.")
    return FulfillmentOrchestrator.get_order_lifecycle_timeline(order)


@router.post("/orders/{order_id}/advance-status", response_model=OrderResponse)
def advance_order_fulfillment_status(
    order_id: int,
    req_in: FulfillmentAdvanceRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin & Staff: Advance order through the fulfillment pipeline (Pick, QC, Pack, Dispatch, Deliver).
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    actor_name = req_in.actor_name or f"{current_admin.first_name} {current_admin.last_name}"
    updated_order = FulfillmentOrchestrator.advance_order_status(
        order=order,
        target_status=req_in.target_status,
        notes=req_in.notes,
        actor_name=actor_name,
        actor_role=req_in.actor_role or "ADMIN",
        db=db
    )

    # Broadcast Realtime Event
    try:
        YuraeEventBus.publish("ORDER_STATUS_CHANGED", {
            "order_id": updated_order.id,
            "order_number": updated_order.order_number,
            "fulfillment_status": updated_order.fulfillment_status,
            "order_status": updated_order.order_status,
            "shipping_status": updated_order.shipping_status,
            "actor_name": actor_name,
            "notes": req_in.notes
        }, target_user_id=updated_order.user_id)
    except Exception as ev_err:
        logger.warning(f"Failed to broadcast fulfillment advancement: {ev_err}")

    return updated_order


# ==========================================
# WMS PICK LISTS
# ==========================================

@router.get("/picklists", response_model=List[PickListResponse])
def list_active_picklists(
    status: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Warehouse: List active pick lists with shelf locations and status.
    """
    query = db.query(PickList)
    if status:
        query = query.filter(PickList.status == status.upper())
    return query.order_by(PickList.created_at.desc()).all()


@router.get("/orders/{order_id}/picklist", response_model=PickListResponse)
def get_order_picklist(
    order_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Warehouse: Retrieve or auto-generate pick list with shelf locations for an order.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    return WarehouseService.generate_pick_list_for_order(order, assigned_staff=f"{current_admin.first_name} {current_admin.last_name}", db=db)


@router.post("/picklists/{picklist_id}/pick-item", response_model=PickListItemResponse)
def record_picked_item(
    picklist_id: int,
    req_in: PickItemRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Warehouse: Record item picked quantity or report missing inventory.
    """
    return WarehouseService.record_pick_item(
        pick_item_id=req_in.item_id,
        quantity_picked=req_in.quantity_picked,
        status=req_in.status,
        notes=req_in.notes,
        actor_name=f"{current_admin.first_name} {current_admin.last_name}",
        db=db
    )


# ==========================================
# QUALITY CONTROL (QC)
# ==========================================

@router.post("/qc/inspect", response_model=QualityCheckResponse)
def submit_quality_inspection(
    req_in: QualityCheckRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    QC Station: Submit 8-point cosmetic and packaging verification report.
    """
    order = db.query(Order).filter(Order.id == req_in.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    return QCService.inspect_order(
        order=order,
        qc_inspector_name=req_in.qc_inspector_name or f"{current_admin.first_name} {current_admin.last_name}",
        status=req_in.status,
        verification_checklist=req_in.verification_checklist,
        batch_number=req_in.batch_number,
        expiry_date=req_in.expiry_date,
        defect_reason=req_in.defect_reason,
        corrective_action=req_in.corrective_action,
        notes=req_in.notes,
        db=db
    )


# ==========================================
# PACKING STATION WORKBENCH
# ==========================================

@router.post("/packing/pack", response_model=PackingResponse)
def submit_packing_completion(
    req_in: PackingRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Packing Station: Submit packing completion, box type, and complimentary sample inclusions.
    """
    order = db.query(Order).filter(Order.id == req_in.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    return PackingService.pack_order(
        order=order,
        packer_name=req_in.packer_name or f"{current_admin.first_name} {current_admin.last_name}",
        box_type=req_in.box_type,
        packaging_checklist=req_in.packaging_checklist,
        free_samples=req_in.free_samples,
        total_weight_kg=req_in.total_weight_kg,
        length_cm=req_in.length_cm,
        breadth_cm=req_in.breadth_cm,
        height_cm=req_in.height_cm,
        notes=req_in.notes,
        db=db
    )


# ==========================================
# SHIPPING LABELS (4x6 INCH THERMAL PDF)
# ==========================================

@router.get("/shipping-labels/{order_id}/pdf")
def stream_shipping_label_pdf(
    order_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin & Warehouse: Stream high-resolution 4x6 inch thermal shipping label PDF with barcode & QR code.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    pdf_bytes = ShippingLabelService.generate_thermal_label_pdf(order)
    filename = f"shipping_label_{order.order_number}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


# ==========================================
# REFUNDS & PAYMENT RECONCILIATION
# ==========================================

@router.post("/refunds/initiate", response_model=RefundResponse)
def initiate_order_refund(
    req_in: RefundRequestCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: Process partial or full refund with inventory restoration and audit logging.
    """
    order = db.query(Order).filter(Order.id == req_in.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    try:
        return RefundService.process_refund(
            order=order,
            amount=req_in.amount,
            reason=req_in.reason,
            refund_type=req_in.refund_type,
            refund_mode=req_in.refund_mode,
            return_request_id=req_in.return_request_id,
            restore_inventory=True,
            admin_notes=req_in.admin_notes,
            actor_name=f"{current_admin.first_name} {current_admin.last_name}",
            db=db
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


@router.get("/refunds", response_model=List[RefundResponse])
def list_refund_records(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: List all processed full & partial refund records.
    """
    return db.query(RefundRecord).order_by(RefundRecord.created_at.desc()).all()


# ==========================================
# NOTIFICATIONS & ENTERPRISE AUDIT LOGS
# ==========================================

@router.get("/notifications", response_model=List[NotificationLogResponse])
def list_notification_logs(
    order_id: Optional[int] = None,
    channel: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: View multi-channel notification history (Email, SMS, WhatsApp).
    """
    query = db.query(NotificationLog)
    if order_id:
        query = query.filter(NotificationLog.order_id == order_id)
    if channel:
        query = query.filter(NotificationLog.channel == channel.upper())
    return query.order_by(NotificationLog.created_at.desc()).limit(100).all()


@router.get("/audit-logs", response_model=List[AuditLogResponse])
def list_audit_logs(
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    search: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: Retrieve tamper-evident audit logs with before/after diffs.
    """
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if action:
        query = query.filter(AuditLog.action == action.upper())
    if search:
        query = query.filter(AuditLog.entity_id.like(f"%{search}%"))
    return query.order_by(AuditLog.created_at.desc()).limit(150).all()


# ==========================================
# WAREHOUSE FACILITIES & SHELF LOCATIONS
# ==========================================

@router.get("/warehouses", response_model=List[WarehouseResponse])
def list_warehouses(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: Retrieve list of physical warehouse facilities.
    """
    WarehouseService.get_or_create_default_warehouse(db)
    return db.query(Warehouse).all()


@router.post("/warehouses", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
def create_warehouse_facility(
    wh_in: WarehouseCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: Add a new warehouse facility.
    """
    existing = db.query(Warehouse).filter(Warehouse.code == wh_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Warehouse code already exists.")

    wh = Warehouse(
        name=wh_in.name,
        code=wh_in.code.upper(),
        contact_name=wh_in.contact_name,
        phone=wh_in.phone,
        email=wh_in.email,
        address_line1=wh_in.address_line1,
        address_line2=wh_in.address_line2,
        city=wh_in.city,
        state=wh_in.state,
        pincode=wh_in.pincode,
        country=wh_in.country,
        is_primary=wh_in.is_primary,
        is_active=wh_in.is_active
    )
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh


@router.get("/inventory/locations", response_model=List[ProductInventoryLocationResponse])
def list_inventory_bin_locations(
    product_id: Optional[int] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin & Warehouse: Retrieve product shelf bin coordinates (Zone, Aisle, Rack, Bin).
    """
    query = db.query(ProductInventoryLocation)
    if product_id:
        query = query.filter(ProductInventoryLocation.product_id == product_id)
    return query.all()
