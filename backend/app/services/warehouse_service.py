"""
Warehouse Management System (WMS) Service
Orchestrates physical warehouses, bin/shelf inventory allocations, pick list generation, and picking station workflows.
"""

import uuid
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import (
    Warehouse, ProductInventoryLocation, PickList, PickListItem, Order, OrderItem, Product
)
from app.services.audit_service import AuditService

logger = logging.getLogger("yurae.wms")


class WarehouseService:
    @staticmethod
    def get_or_create_default_warehouse(db: Session) -> Warehouse:
        """
        Retrieves the primary warehouse or seeds the default Yurae Bengaluru Atelier Facility.
        """
        wh = db.query(Warehouse).filter(Warehouse.is_primary == True).first()
        if not wh:
            wh = db.query(Warehouse).first()
        if not wh:
            wh = Warehouse(
                name="YURAE Bengaluru Atelier & Fulfillment Hub",
                code="WH-BLR-01",
                contact_name="Aditya Varma",
                phone="+91 80 4123 4567",
                email="dispatch.blr@yurae.luxury",
                address_line1="Plot 42, EPIP Industrial Zone, Phase 1",
                address_line2="Whitefield",
                city="Bengaluru",
                state="Karnataka",
                pincode="560066",
                country="India",
                is_primary=True,
                is_active=True
            )
            db.add(wh)
            db.commit()
            db.refresh(wh)
            logger.info("Initialized default primary warehouse: WH-BLR-01")
        return wh

    @classmethod
    def get_or_create_product_bin_location(cls, product_id: int, db: Session) -> ProductInventoryLocation:
        """
        Retrieves product warehouse bin coordinate or auto-assigns an optimal location.
        """
        wh = cls.get_or_create_default_warehouse(db)
        loc = db.query(ProductInventoryLocation).filter(
            ProductInventoryLocation.product_id == product_id,
            ProductInventoryLocation.warehouse_id == wh.id
        ).first()

        if not loc:
            prod = db.query(Product).filter(Product.id == product_id).first()
            # Determine Zone based on category
            cat_name = prod.category.name.lower() if (prod and prod.category) else "skincare"
            zone = "Zone A (Skincare)" if "skin" in cat_name or "face" in cat_name else ("Zone B (Apparel)" if "apparel" in cat_name or "dress" in cat_name else "Zone C (Botanicals)")
            aisle_num = (product_id % 5) + 1
            rack_num = (product_id % 4) + 1
            bin_num = f"B-{(product_id % 20) + 1:02d}"

            loc = ProductInventoryLocation(
                product_id=product_id,
                warehouse_id=wh.id,
                zone=zone,
                aisle=f"Aisle {aisle_num}",
                rack=f"Rack {rack_num}",
                shelf_bin=f"{zone.split()[0]}-A{aisle_num}-R{rack_num}-{bin_num}",
                batch_number=f"BAT-2026-{(product_id % 90) + 10:02d}",
                mfg_date="2026-01-15",
                exp_date="2028-01-15",
                stock_quantity=prod.stock_quantity if prod else 50,
                reserved_quantity=0
            )
            db.add(loc)
            db.commit()
            db.refresh(loc)
        return loc

    @classmethod
    def generate_pick_list_for_order(
        cls,
        order: Order,
        assigned_staff: str = "Atelier Warehouse Specialist",
        db: Session = None
    ) -> PickList:
        """
        Generates or retrieves structured PickList with shelf locations and SKU barcodes for an order.
        """
        existing = db.query(PickList).filter(PickList.order_id == order.id).first()
        if existing:
            return existing

        wh = cls.get_or_create_default_warehouse(db)
        today_str = datetime.utcnow().strftime("%Y%m%d")
        pkl_num = f"PKL-{today_str}-{order.order_number[-6:]}"

        picklist = PickList(
            picklist_number=pkl_num,
            order_id=order.id,
            warehouse_id=wh.id,
            assigned_staff_name=assigned_staff,
            status="GENERATED",
            created_at=datetime.utcnow()
        )
        db.add(picklist)
        db.commit()
        db.refresh(picklist)

        # Generate Pick List Items with shelf locations
        for o_item in order.items:
            bin_loc = cls.get_or_create_product_product_bin = cls.get_or_create_product_bin_location(o_item.product_id, db)
            prod = db.query(Product).filter(Product.id == o_item.product_id).first()
            sku = prod.sku if prod else f"YUR-SKU-{o_item.product_id}"

            p_item = PickListItem(
                picklist_id=picklist.id,
                order_item_id=o_item.id,
                product_id=o_item.product_id,
                product_name=o_item.product_name,
                sku=sku,
                variant_info=o_item.variant_info or "Standard",
                shelf_location=bin_loc.shelf_bin,
                barcode=f"*{sku}*",
                quantity_required=o_item.quantity,
                quantity_picked=0,
                status="PENDING"
            )
            db.add(p_item)

        db.commit()
        db.refresh(picklist)

        AuditService.log_event(
            action="GENERATE_PICKLIST",
            entity_type="PickList",
            entity_id=picklist.picklist_number,
            actor_name=assigned_staff,
            actor_role="WAREHOUSE_STAFF",
            new_value={"order_id": order.id, "total_items": len(picklist.items)},
            db=db
        )
        logger.info(f"Generated PickList #{picklist.picklist_number} for Order #{order.order_number}")
        return picklist

    @classmethod
    def record_pick_item(
        cls,
        pick_item_id: int,
        quantity_picked: int,
        status: str = "PICKED",
        notes: Optional[str] = None,
        actor_name: str = "Atelier Warehouse Specialist",
        db: Session = None
    ) -> PickListItem:
        """
        Updates quantity picked for an item in a pick list and marks status.
        """
        p_item = db.query(PickListItem).filter(PickListItem.id == pick_item_id).first()
        if not p_item:
            raise ValueError("Pick list item not found.")

        p_item.quantity_picked = quantity_picked
        p_item.status = status.upper()
        if notes:
            p_item.notes = notes

        # Check if all items in picklist are completed
        picklist = p_item.pick_list
        all_items = picklist.items
        all_done = all(it.status in ["PICKED", "SHORTAGE", "DAMAGED"] for it in all_items)
        if all_done:
            has_discrepancy = any(it.status in ["SHORTAGE", "DAMAGED"] for it in all_items)
            picklist.status = "DISCREPANCY" if has_discrepancy else "PICKED"
            picklist.picked_at = datetime.utcnow()
            # If order is ready, update order milestone
            if not has_discrepancy and picklist.order:
                picklist.order.picked_at = datetime.utcnow()
                picklist.order.fulfillment_status = "ITEMS_PICKED"

        db.commit()
        db.refresh(p_item)

        AuditService.log_event(
            action="PICK_ITEM",
            entity_type="PickListItem",
            entity_id=str(p_item.id),
            actor_name=actor_name,
            actor_role="WAREHOUSE_STAFF",
            new_value={"sku": p_item.sku, "qty_picked": quantity_picked, "status": p_item.status},
            db=db
        )
        return p_item
