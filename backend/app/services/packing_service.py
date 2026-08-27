"""
Packing Station Service
Manages luxury packaging workbench checklist, box selection, complimentary gift sample allocations, and weight verification.
"""

import json
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import Order, PackingLog
from app.services.audit_service import AuditService

logger = logging.getLogger("yurae.packing")


class PackingService:
    @staticmethod
    def get_sample_recommendations_for_order(order: Order) -> List[str]:
        """
        Determines complimentary samples and gifts based on basket value.
        """
        samples = []
        if order.total_amount >= 1500:
            samples.append("✨ Saffron Glow Elixir Sample (5ml)")
        if order.total_amount >= 3000:
            samples.append("🌸 Rose & Vetiver Facial Toner Mist (10ml)")
            samples.append("🌿 Reusable Organic Botanical Muslin Pouch")
        if not samples:
            samples.append("✨ Signature Botanical Scent Card")
        return samples

    @classmethod
    def pack_order(
        cls,
        order: Order,
        packer_name: str,
        box_type: str,
        packaging_checklist: Dict[str, bool],
        free_samples: Optional[List[str]] = None,
        total_weight_kg: float = 0.45,
        length_cm: float = 15.0,
        breadth_cm: float = 10.0,
        height_cm: float = 8.0,
        notes: Optional[str] = None,
        db: Session = None
    ) -> PackingLog:
        """
        Submits packing completion report, attaches sample list, and advances order to PACKED.
        """
        if free_samples is None:
            free_samples = cls.get_sample_recommendations_for_order(order)

        chk_json = json.dumps(packaging_checklist)
        samples_json = json.dumps(free_samples)

        pack_log = PackingLog(
            order_id=order.id,
            packer_name=packer_name or "Atelier Packing Specialist",
            box_type=box_type or "LUXURY_SLIM_BOX",
            packaging_checklist=chk_json,
            free_samples=samples_json,
            total_weight_kg=total_weight_kg,
            length_cm=length_cm,
            breadth_cm=breadth_cm,
            height_cm=height_cm,
            notes=notes,
            created_at=datetime.utcnow()
        )
        db.add(pack_log)

        order.packed_at = datetime.utcnow()
        order.free_samples_included = samples_json
        order.fulfillment_status = "PACKED"

        db.commit()
        db.refresh(pack_log)
        db.refresh(order)

        AuditService.log_event(
            action="PACK_ORDER",
            entity_type="PackingLog",
            entity_id=str(pack_log.id),
            actor_name=packer_name,
            actor_role="PACKER",
            new_value={"order_id": order.id, "box_type": box_type, "weight_kg": total_weight_kg},
            db=db
        )
        logger.info(f"Order #{order.order_number} successfully packed into {box_type} by {packer_name}")
        return pack_log
