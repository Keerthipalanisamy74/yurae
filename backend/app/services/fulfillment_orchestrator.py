"""
Enterprise Order Fulfillment Lifecycle Orchestrator
Master state machine coordinating 18+ milestone order progression, atomic inventory management,
courier transitions, notification hooks, and tamper-evident audit trails.
"""

import json
import logging
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import Order, Product, OrderItem
from app.services.warehouse_service import WarehouseService
from app.services.shipping_service import ShippingService
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService

logger = logging.getLogger("yurae.orchestrator")

LIFECYCLE_STAGES = [
    ("NEW_ORDER", "New Order Created"),
    ("PAYMENT_VERIFIED", "Payment Verified"),
    ("ORDER_CONFIRMED", "Order Confirmed & Atelier Allocated"),
    ("PICK_LIST_GENERATED", "Pick List Generated (WMS)"),
    ("ITEMS_PICKED", "Botanicals & Formulations Picked"),
    ("QUALITY_CHECKED", "Quality Control (QC) Passed"),
    ("PACKING_STARTED", "Packing Station Workbench Active"),
    ("PACKED", "Packed with Luxury Samples & Sealed"),
    ("INVOICE_GENERATED", "Tax Invoice (PDF) Generated"),
    ("SHIPPING_LABEL_PRINTED", "4x6 Barcode Shipping Label Ready"),
    ("COURIER_ASSIGNED", "Carrier & AWB Assigned"),
    ("PICKUP_SCHEDULED", "Courier Pickup Scheduled"),
    ("PICKED_UP", "Parcel Picked Up by Carrier"),
    ("IN_TRANSIT", "In Transit Across National Hubs"),
    ("DESTINATION_HUB", "Arrived at Destination City Hub"),
    ("OUT_FOR_DELIVERY", "Out for Doorstep Delivery"),
    ("DELIVERED", "Delivered to Patron"),
    ("REVIEW_REQUESTED", "Patron Review & Glow Photo Requested"),
    ("ORDER_COMPLETED", "Order Lifecycle Completed"),
]


class FulfillmentOrchestrator:
    @classmethod
    def get_order_lifecycle_timeline(cls, order: Order) -> Dict[str, Any]:
        """
        Generates full milestone status progress stepper and timeline metadata.
        """
        current_status = (order.fulfillment_status or "NEW_ORDER").upper()
        
        # Calculate milestone completion indices
        stage_keys = [s[0] for s in LIFECYCLE_STAGES]
        try:
            current_idx = stage_keys.index(current_status)
        except ValueError:
            current_idx = 0

        milestones = []
        for idx, (s_key, label) in enumerate(LIFECYCLE_STAGES):
            is_completed = (idx <= current_idx)
            is_current = (s_key == current_status)
            
            # Map timestamps
            ts = None
            if s_key == "NEW_ORDER":
                ts = order.created_at
            elif s_key == "ITEMS_PICKED":
                ts = order.picked_at
            elif s_key == "QUALITY_CHECKED":
                ts = order.qc_at
            elif s_key == "PACKED":
                ts = order.packed_at
            elif s_key == "INVOICE_GENERATED":
                ts = order.invoice_generated_at or order.packed_at
            elif s_key == "SHIPPING_LABEL_PRINTED":
                ts = order.shipping_label_generated_at or order.packed_at
            elif s_key == "SHIPPED" or s_key == "PICKED_UP":
                ts = order.shipped_at
            elif s_key == "DELIVERED":
                ts = order.delivered_at
            elif s_key == "ORDER_COMPLETED":
                ts = order.completed_at

            milestones.append({
                "stage_key": s_key,
                "label": label,
                "timestamp": ts.strftime("%Y-%m-%d %H:%M:%S") if ts else None,
                "is_completed": is_completed,
                "is_current": is_current,
                "notes": None
            })

        # Compile tracking history
        history = []
        for ev in order.tracking_events:
            history.append({
                "status": ev.status,
                "activity": ev.activity,
                "location": ev.location,
                "event_time": ev.event_time.strftime("%Y-%m-%d %H:%M:%S") if ev.event_time else None
            })

        return {
            "order_id": order.id,
            "order_number": order.order_number,
            "current_status": order.order_status,
            "fulfillment_status": current_status,
            "payment_status": order.payment_status,
            "shipping_status": order.shipping_status,
            "awb_code": order.awb_code,
            "courier_name": order.courier_name,
            "milestones": milestones,
            "history_events": history
        }

    @classmethod
    def advance_order_status(
        cls,
        order: Order,
        target_status: str,
        notes: Optional[str] = None,
        actor_name: str = "Admin Specialist",
        actor_role: str = "ADMIN",
        db: Session = None
    ) -> Order:
        """
        Validates transition preconditions, updates order status, fires automated side effects,
        logs audit events, and dispatches customer notifications.
        """
        old_status = (order.fulfillment_status or "NEW_ORDER").upper()
        new_status = target_status.upper()

        if old_status == new_status:
            return order

        # Transition Side Effects & Validations
        if new_status in ["ORDER_CONFIRMED", "PICK_LIST_GENERATED"]:
            order.order_status = "Confirmed"
            # Auto-generate PickList
            WarehouseService.generate_pick_list_for_order(order, assigned_staff=actor_name, db=db)
            order.fulfillment_status = "PICK_LIST_GENERATED"
            NotificationService.send_order_milestone_notification(order, "ORDER_CONFIRMED", "EMAIL", db=db)

        elif new_status == "ITEMS_PICKED":
            order.picked_at = datetime.utcnow()
            order.fulfillment_status = "ITEMS_PICKED"
            order.order_status = "Processing"

        elif new_status == "QUALITY_CHECKED":
            order.qc_at = datetime.utcnow()
            order.fulfillment_status = "QUALITY_CHECKED"
            order.order_status = "Processing"

        elif new_status == "PACKING_STARTED":
            order.fulfillment_status = "PACKING_STARTED"
            order.order_status = "Processing"

        elif new_status == "PACKED":
            order.packed_at = datetime.utcnow()
            order.fulfillment_status = "PACKED"
            order.order_status = "Processing"
            NotificationService.send_order_milestone_notification(order, "PACKED", "EMAIL", db=db)

        elif new_status in ["COURIER_ASSIGNED", "PICKUP_SCHEDULED", "SHIPPED", "IN_TRANSIT"]:
            # Auto assign AWB if not yet assigned
            if not order.awb_code:
                try:
                    ShippingService.execute_automated_shipping_flow(order.id, db)
                except Exception as e:
                    logger.warning(f"Could not auto-generate courier assignment: {e}")
            
            order.shipped_at = order.shipped_at or datetime.utcnow()
            order.order_status = "Shipped"
            order.shipping_status = "IN_TRANSIT" if new_status in ["IN_TRANSIT", "SHIPPED"] else "AWB_ASSIGNED"
            order.fulfillment_status = new_status
            if new_status in ["SHIPPED", "IN_TRANSIT"]:
                NotificationService.send_order_milestone_notification(order, "SHIPPED", "EMAIL", db=db)

        elif new_status == "OUT_FOR_DELIVERY":
            order.order_status = "Out for Delivery"
            order.shipping_status = "OUT_FOR_DELIVERY"
            order.fulfillment_status = "OUT_FOR_DELIVERY"
            NotificationService.send_order_milestone_notification(order, "OUT_FOR_DELIVERY", "SMS", db=db)

        elif new_status == "DELIVERED":
            order.delivered_at = datetime.utcnow()
            order.order_status = "Delivered"
            order.shipping_status = "DELIVERED"
            order.fulfillment_status = "DELIVERED"
            if order.payment_status in ["Pending", "PENDING"]:
                order.payment_status = "Paid" # Reconcile COD
            NotificationService.send_order_milestone_notification(order, "DELIVERED", "EMAIL", db=db)

        elif new_status in ["REVIEW_REQUESTED", "ORDER_COMPLETED"]:
            order.completed_at = datetime.utcnow()
            order.order_status = "Delivered"
            order.fulfillment_status = "ORDER_COMPLETED"
            NotificationService.send_order_milestone_notification(order, "REVIEW_REQUEST", "EMAIL", db=db)

        elif new_status == "CANCELLED":
            order.cancelled_at = datetime.utcnow()
            order.order_status = "Cancelled"
            order.fulfillment_status = "CANCELLED"
            order.shipping_status = "CANCELLED"
            # Restore inventory
            for item in order.items:
                prod = db.query(Product).filter(Product.id == item.product_id).first()
                if prod:
                    prod.stock_quantity += item.quantity

        else:
            order.fulfillment_status = new_status

        if notes:
            order.internal_notes = f"{order.internal_notes or ''}\n[{datetime.utcnow().strftime('%Y-%m-%d %H:%M')} - {actor_name}]: {notes}".strip()

        db.commit()
        db.refresh(order)

        AuditService.log_event(
            action="ADVANCE_FULFILLMENT_STATUS",
            entity_type="Order",
            entity_id=order.order_number,
            actor_name=actor_name,
            actor_role=actor_role,
            old_value={"fulfillment_status": old_status},
            new_value={"fulfillment_status": order.fulfillment_status, "order_status": order.order_status},
            db=db
        )

        logger.info(f"Order #{order.order_number} advanced from {old_status} to {order.fulfillment_status}")
        return order
