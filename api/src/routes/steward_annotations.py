from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.database import get_db, replay_transaction
from src.models.steward_annotation import StewardAnnotation
from src.schemas.steward_annotation_schema import (
    StewardAnnotationCreate,
    StewardAnnotationOut,
)
from src.services.continuity_event_service import emit_continuity_event

router = APIRouter()


@router.post("/steward-annotations", response_model=StewardAnnotationOut)
def add_steward_annotation(
    annotation: StewardAnnotationCreate,
    db: Session = Depends(get_db),
):
    with replay_transaction(db):
        db_annotation = StewardAnnotation(**annotation.dict())
        db.add(db_annotation)
        db.flush()

        event = emit_continuity_event(
            db,
            business_owner_id=annotation.steward_id,
            business_category_key=None,
            business_line=None,
            event_type="steward_annotation_added",
            actor_type="steward",
            actor_id=annotation.steward_id,
            related_entity_type="steward_annotation",
            related_entity_id=str(db_annotation.id),
            parent_event_id=annotation.target_event_id,
            payload={
                "target_event_id": annotation.target_event_id,
                "annotation_type": annotation.annotation_type,
                "visibility": annotation.visibility,
                "summary_available": True,
            },
            auto_commit=False,
        )

        db_annotation.continuity_event_id = str(event.id)
        db.flush()
        db.refresh(db_annotation)

    return db_annotation


@router.get(
    "/steward-annotations/event/{target_event_id}",
    response_model=list[StewardAnnotationOut],
)
def get_annotations_for_event(
    target_event_id: str,
    db: Session = Depends(get_db),
):
    annotations = (
        db.query(StewardAnnotation)
        .filter(StewardAnnotation.target_event_id == target_event_id)
        .order_by(StewardAnnotation.created_at.asc())
        .all()
    )

    return annotations
