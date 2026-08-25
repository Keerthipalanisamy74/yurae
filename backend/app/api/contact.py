from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.models.models import ContactMessage, User
from app.schemas.schemas import (
    ContactMessageCreate,
    ContactMessageUpdate,
    ContactMessageResponse,
)
from app.api.deps import get_current_admin

router = APIRouter(prefix="/contact", tags=["Contact Messages"])

@router.post("", response_model=ContactMessageResponse, status_code=status.HTTP_201_CREATED)
def submit_contact_message(
    msg_in: ContactMessageCreate,
    db: Session = Depends(get_db)
):
    """
    Public endpoint for customers to submit an inquiry, contact message, or order query.
    """
    if not msg_in.name.strip() or not msg_in.email.strip() or not msg_in.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name, email, and message are required."
        )

    new_msg = ContactMessage(
        name=msg_in.name.strip(),
        email=msg_in.email.strip(),
        phone=msg_in.phone.strip() if msg_in.phone else None,
        subject=msg_in.subject.strip() if msg_in.subject else None,
        message=msg_in.message.strip(),
        source=msg_in.source.upper() if msg_in.source else "CONTACT_FORM",
        order_number=msg_in.order_number.strip() if msg_in.order_number else None,
        rating=msg_in.rating.strip() if msg_in.rating else None,
        status="UNREAD"
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg

@router.get("", response_model=List[ContactMessageResponse])
def get_contact_messages(
    status_filter: Optional[str] = Query(None, alias="status"),
    source_filter: Optional[str] = Query(None, alias="source"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Admin endpoint to view received contact messages and inquiries, with source filtering.
    """
    query = db.query(ContactMessage)
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(ContactMessage.status == status_filter.upper())
    if source_filter and source_filter.upper() != "ALL":
        query = query.filter(ContactMessage.source == source_filter.upper())
    
    # Sort unread first, then newest
    return query.order_by(ContactMessage.created_at.desc()).all()

@router.get("/{message_id}", response_model=ContactMessageResponse)
def get_contact_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    return msg

@router.put("/{message_id}", response_model=ContactMessageResponse)
def update_contact_message(
    message_id: int,
    update_in: ContactMessageUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    if update_in.status is not None:
        msg.status = update_in.status.upper()
    if update_in.admin_notes is not None:
        msg.admin_notes = update_in.admin_notes

    db.commit()
    db.refresh(msg)
    return msg

@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(msg)
    db.commit()
    return None
