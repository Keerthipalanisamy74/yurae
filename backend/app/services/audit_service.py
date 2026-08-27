"""
Enterprise Tamper-Evident Audit Logging Service
Captures immutable audit trail logs for all staff actions, inventory adjustments, and status transitions.
"""

import json
import logging
from typing import Optional, Any, Dict
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import AuditLog

logger = logging.getLogger("yurae.audit")


class AuditService:
    @staticmethod
    def log_event(
        action: str,
        entity_type: str,
        entity_id: str,
        actor_id: Optional[int] = None,
        actor_name: str = "System Engine",
        actor_role: str = "SYSTEM",
        old_value: Optional[Any] = None,
        new_value: Optional[Any] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        db: Optional[Session] = None
    ) -> Optional[AuditLog]:
        """
        Records an immutable audit log entry in MySQL database.
        """
        if not db:
            logger.warning("AuditService called without DB session.")
            return None

        try:
            old_json = json.dumps(old_value, default=str) if old_value is not None else None
            new_json = json.dumps(new_value, default=str) if new_value is not None else None

            log = AuditLog(
                actor_id=actor_id,
                actor_name=actor_name,
                actor_role=actor_role.upper() if actor_role else "SYSTEM",
                action=action.upper(),
                entity_type=entity_type,
                entity_id=str(entity_id),
                old_value_json=old_json,
                new_value_json=new_json,
                ip_address=ip_address,
                user_agent=user_agent,
                created_at=datetime.utcnow()
            )
            db.add(log)
            db.commit()
            db.refresh(log)
            logger.info(f"AUDIT [{action}] on {entity_type} #{entity_id} by {actor_name} ({actor_role})")
            return log
        except Exception as e:
            logger.error(f"Failed to record audit log: {e}")
            return None
