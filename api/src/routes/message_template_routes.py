from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from src.database import SessionLocal
from src.models.message_template import MessageTemplate
from src.schemas.message_template_schema import MessageTemplateCreate, MessageTemplateUpdate, MessageTemplateOut
from src.services.message_template_service import create_message_template_timeline_event
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
    db_template = MessageTemplate(**template.dict())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    create_message_template_timeline_event(db, db_template.id, "created", "Message template created")
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
    for key, value in update.dict(exclude_unset=True).items():
        setattr(template, key, value)
    template.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(template)
    create_message_template_timeline_event(db, template.id, "updated", "Message template updated")
    return template

@router.delete("/message-templates/{template_id}")
def delete_message_template(template_id: str, db: Session = Depends(get_db)):
    template = db.query(MessageTemplate).filter(MessageTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Message template not found")
    db.delete(template)
    db.commit()
    create_message_template_timeline_event(db, template_id, "deleted", "Message template deleted")
    return {"detail": "Message template deleted"}
