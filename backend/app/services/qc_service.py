"""
Quality Control (QC) Service
Orchestrates pre-packing 8-point cosmetic and formulation verification protocols.
"""

import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import Order, QualityCheckLog
from app.services.audit_service import AuditService

logger = logging.getLogger("yurae.qc")


class QCService:
    @staticmethod
    def inspect_order(
        order: Order,
        qc_inspector_name: str,
        status: str,
        verification_checklist: Dict[str, bool],
        batch_number: Optional[str] = None,
        expiry_date: Optional[str] = None,
        defect_reason: Optional[str] = None,
        corrective_action: Optional[str] = None,
        notes: Optional[str] = None,
        db: Session = None
    ) -> QualityCheckLog:
        """
        Submits QC verification report for picked order items.
        """
        checklist_json = json.dumps(verification_checklist)
        status_clean = status.upper()

        qc_log = QualityCheckLog(
            order_id=order.id,
            qc_inspector_name=qc_inspector_name or "Lead QC Specialist",
            status=status_clean,
            verification_checklist=checklist_json,
            batch_number=batch_number or f"BAT-2026-{order.id:04d}",
            expiry_date=expiry_date or "2028-01-15",
            defect_reason=defect_reason,
            corrective_action=corrective_action,
            notes=notes,
            created_at=datetime.utcnow()
        )
        db.add(qc_log)

        if status_clean == "PASSED":
            order.qc_at = datetime.utcnow()
            order.fulfillment_status = "QUALITY_CHECKED"
            logger.info(f"Order #{order.order_number} passed QC inspection by {qc_inspector_name}")
        else:
            order.fulfillment_status = "PICK_LIST_GENERATED" # Roll back for replacement pick
            logger.warning(f"Order #{order.order_number} FAILED QC inspection: {defect_reason}")

        db.commit()
        db.refresh(qc_log)
        db.refresh(order)

        AuditService.log_event(
            action="QC_INSPECT",
            entity_type="QualityCheckLog",
            entity_id=str(qc_log.id),
            actor_name=qc_inspector_name,
            actor_role="QC_INSPECTOR",
            new_value={"order_id": order.id, "status": status_clean, "defect": defect_reason},
            db=db
        )
        return qc_log
