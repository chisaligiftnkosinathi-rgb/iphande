from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from src.database import SessionLocal, replay_transaction
from src.models.message_template import MessageTemplate
from src.schemas.message_template_schema import MessageTemplateCreate, MessageTemplateUpdate, MessageTemplateOut
from src.services.continuity_event_service import emit_continuity_event
from datetime import datetime

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/message-templates", response_model=MessageTemplateOut)
def create_message_template(template: MessageTemplateCreate, db: Session = Depends(get_db)):
    with replay_transaction(db):
        db_template = MessageTemplate(**template.dict())
        db.add(db_template)
        db.flush()

        event = emit_continuity_event(
            db,
            business_owner_id=db_template.owner_profile_id,
            business_category_key=None,
            business_line=None,
            event_type="message_template_created",
            actor_type="business_owner",
            actor_id=db_template.owner_profile_id,
            related_entity_type="message_template",
            related_entity_id=str(db_template.id),
            parent_event_id=None,
            payload={
                "surface": "message_template",
                "action": "created",
                "summary_available": True,
            },
            auto_commit=False,
        )
        db_template.continuity_event_id = str(event.id)
        db.flush()
        db.refresh(db_template)
    return db_template

@router.get("/message-templates", response_model=list[MessageTemplateOut])
def list_message_templates(db: Session = Depends(get_db)):
    return db.query(MessageTemplate).all()

@router.get("/message-templates/{template_id}", response_model=MessageTemplateOut)
def get_message_template(template_id: str, db: Session = Depends(get_db)):
    template = db.query(MessageTemplate).filter(MessageTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Message template not found")
    return template

@router.patch("/message-templates/{template_id}", response_model=MessageTemplateOut)
def update_message_template(template_id: str, update: MessageTemplateUpdate, db: Session = Depends(get_db)):
    template = db.query(MessageTemplate).filter(MessageTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Message template not found")

    update_data = update.dict(exclude_unset=True)
    if not update_data:
        return template

    with replay_transaction(db):
        for key, value in update_data.items():
            setattr(template, key, value)
        template.updated_at = datetime.utcnow()

        event = emit_continuity_event(
            db,
            business_owner_id=template.owner_profile_id,
            business_category_key=None,
            business_line=None,
            event_type="message_template_amended",
            actor_type="business_owner",
            actor_id=template.owner_profile_id,
            related_entity_type="message_template",
            related_entity_id=str(template.id),
            parent_event_id=getattr(template, "continuity_event_id", None),
            payload={
                "surface": "message_template",
                "action": "amended",
                "updated_fields": list(update_data.keys()),
                "summary_available": True,
            },
            auto_commit=False,
        )
        template.continuity_event_id = str(event.id)
        db.flush()
        db.refresh(template)
    return template

@router.delete("/message-templates/{template_id}")
def delete_message_template(template_id: str, db: Session = Depends(get_db)):
    template = db.query(MessageTemplate).filter(MessageTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Message template not found")

    with replay_transaction(db):
        template.is_archived = True
        emit_continuity_event(
            db,
            business_owner_id=template.owner_profile_id,
            business_category_key=None,
            business_line=None,
            event_type="message_template_archived",
            actor_type="business_owner",
            actor_id=template.owner_profile_id,
            related_entity_type="message_template",
            related_entity_id=str(template.id),
            parent_event_id=getattr(template, "continuity_event_id", None),
            payload={
                "surface": "message_template",
                "action": "archived",
                "summary_available": True,
            },
            auto_commit=False,
        )
        db.flush()
        db.refresh(template)
    return {"detail": "Message template archived"}
