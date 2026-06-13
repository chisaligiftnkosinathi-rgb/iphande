from fastapi import APIRouter, HTTPException, Depends, Body, Query
from sqlalchemy.orm import Session
from datetime import datetime
from src.database import SessionLocal, replay_transaction, get_db
from src.models.content_post import ContentPost
from src.models.continuity_event_model import ContinuityEvent
from src.schemas.content_post_schema import ContentPostCreate, ContentPostUpdate, ContentPostOut, GeneratedContentPostOut
from src.schemas.content_timeline_schema import ContentTimelineOut
from src.services.content_post_service import generate_content_post
from src.services.continuity_event_service import emit_continuity_event
from src.services.content_timeline_service import get_content_timeline
from src.replay.constants import ContinuityEventType, ActorType, EntityType

router = APIRouter()


@router.post("/content-posts", response_model=ContentPostOut)
def create_content_post(post: ContentPostCreate, db: Session = Depends(get_db)):
    try:
        db_post = ContentPost(**post.dict())
        db.add(db_post)
        db.flush()
        db.refresh(db_post)

        emit_continuity_event(
            db,
            business_owner_id=post.owner_profile_id,
            business_category_key=None,
            business_line=post.business_line,
            event_type="content_created_manually",
            actor_type="business_owner",
            actor_id=post.owner_profile_id,
            related_entity_type="content_post",
            related_entity_id=str(db_post.id),
            payload={"title": post.title, "channel": post.channel},
            auto_commit=False
        )

        db.commit()
    except Exception:
        db.rollback()
        raise
    return db_post

def get_latest_content_post_event(db: Session, content_post_id: str):
    return (
        db.query(ContinuityEvent)
        .filter(
            ContinuityEvent.related_entity_type == EntityType.CONTENT_POST,
            ContinuityEvent.related_entity_id == content_post_id,
        )
        .order_by(ContinuityEvent.lineage_sequence.desc())
        .first()
    )


def transition_content_post_status(
    *,
    content_post_id: str,
    next_status: str,
    event_type: str,
    payload: dict,
    db: Session,
):
    post = db.query(ContentPost).filter(ContentPost.id == content_post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Content post not found")

    previous_status = post.status
    if previous_status == next_status:
        return post

    with replay_transaction(db):
        parent_event = get_latest_content_post_event(db, content_post_id)
        post.status = next_status
        post.updated_at = datetime.utcnow()

        emit_continuity_event(
            db,
            business_owner_id=post.owner_profile_id,
            business_category_key=None,
            business_line=post.business_line,
            event_type=event_type,
            actor_type=ActorType.BUSINESS_OWNER,
            actor_id=post.owner_profile_id,
            related_entity_type=EntityType.CONTENT_POST,
            related_entity_id=content_post_id,
            parent_event_id=parent_event.id if parent_event else None,
            payload={
                "previous_status": previous_status,
                "next_status": next_status,
                "template_key": post.template_key,
                "goal_key": post.post_type,
                **payload,
            },
            auto_commit=False,
        )
        db.refresh(post)
    return post


@router.get("/content-posts", response_model=list[ContentPostOut])
def list_content_posts(
    owner_profile_id: str | None = Query(default=None),
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(ContentPost)
    if owner_profile_id:
        query = query.filter(ContentPost.owner_profile_id == owner_profile_id)
    if status:
        query = query.filter(ContentPost.status == status)
    return query.order_by(ContentPost.created_at.desc()).all()


@router.get("/content-posts/{content_post_id}", response_model=ContentPostOut)
def get_content_post(content_post_id: str, db: Session = Depends(get_db)):
    post = db.query(ContentPost).filter(ContentPost.id == content_post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Content post not found")
    return post

@router.patch("/content-posts/{content_post_id}", response_model=ContentPostOut)
def update_content_post(content_post_id: str, update: ContentPostUpdate, db: Session = Depends(get_db)):
    post = db.query(ContentPost).filter(ContentPost.id == content_post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Content post not found")

    try:
        updated_fields = update.dict(exclude_unset=True)
        for key, value in updated_fields.items():
            setattr(post, key, value)
        post.updated_at = datetime.utcnow()

        emit_continuity_event(
            db,
            business_owner_id=post.owner_profile_id,
            business_category_key=None,
            business_line=post.business_line,
            event_type="content_updated",
            actor_type=ActorType.BUSINESS_OWNER,
            actor_id=post.owner_profile_id,
            related_entity_type=EntityType.CONTENT_POST,
            related_entity_id=content_post_id,
            payload={"updated_fields": list(updated_fields.keys())},
            auto_commit=False
        )

        db.commit()
        db.refresh(post)
    except Exception:
        db.rollback()
        raise
    return post

@router.delete("/content-posts/{content_post_id}")
def delete_content_post(content_post_id: str, db: Session = Depends(get_db)):
    post = db.query(ContentPost).filter(ContentPost.id == content_post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Content post not found")

    try:
        post.status = "deleted"
        post.updated_at = datetime.utcnow()

        emit_continuity_event(
            db,
            business_owner_id=post.owner_profile_id,
            business_category_key=None,
            business_line=post.business_line,
            event_type="content_deleted",
            actor_type=ActorType.BUSINESS_OWNER,
            actor_id=post.owner_profile_id,
            related_entity_type=EntityType.CONTENT_POST,
            related_entity_id=content_post_id,
            payload={},
            auto_commit=False
        )

        db.commit()
    except Exception:
        db.rollback()
        raise
    return {"detail": "Content post marked as deleted"}


@router.post("/content-posts/generate", response_model=GeneratedContentPostOut)
def generate_post(data: dict = Body(...), db: Session = Depends(get_db)):
    result = generate_content_post(data)
    print("GENERATOR RETURNING:", result)

    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    business_owner_id = data.get("business_owner_id") or data.get("owner_profile_id") or "unknown"
    business_category_key = result.get("business_category_key")
    business_line = result.get("business_line")

    with replay_transaction(db):
        # Step 1: Create a content_posts row
        db_post = ContentPost(
            owner_profile_id=business_owner_id,
            business_line=business_line or "unknown",
            channel=result.get("platform", "unknown"),
            post_type=result.get("goal_key", "unknown"),
            template_key=result.get("template_key"),
            title=result.get("hook", "Generated Post") if result.get("hook") else "Generated Post",
            body=result.get("caption", ""),
            call_to_action=result.get("call_to_action", ""),
            whatsapp_share_url=result.get("whatsapp_share_url"),
            facebook_share_url=result.get("facebook_share_url"),
            status="draft"
        )
        db.add(db_post)
        db.flush()
        db.refresh(db_post)

        content_post_id = str(db_post.id)
        result["id"] = content_post_id
        result["content_post_id"] = content_post_id

        # Step 2: Persist in-memory generation events
        previous_event_id = None
        for ev in result.get("events", []):
            # Ensure platform and goal_key are safely captured inside the payload
            payload = ev.get("payload", {})
            if "platform" not in payload:
                payload["platform"] = ev.get("platform", result.get("platform", "unknown"))
            if "goal_key" not in payload:
                payload["goal_key"] = ev.get("goal_key", result.get("goal_key"))

            emitted_event = emit_continuity_event(
                db,
                business_owner_id=business_owner_id,
                business_category_key=ev.get("business_category_key", business_category_key),
                business_line=business_line,
                event_type=ev.get("event_type"),
                actor_type=ActorType.SYSTEM,
                actor_id=business_owner_id,
                related_entity_type=EntityType.CONTENT_POST,
                related_entity_id=content_post_id,
                parent_event_id=previous_event_id,
                payload=payload,
                auto_commit=False
            )
            previous_event_id = emitted_event.id

        # Step 3: Emit final content_generated event
        emit_continuity_event(
            db,
            business_owner_id=business_owner_id,
            business_category_key=business_category_key,
            business_line=business_line,
            event_type=ContinuityEventType.CONTENT_GENERATED,
            actor_type=ActorType.BUSINESS_OWNER,
            actor_id=business_owner_id,
            related_entity_type=EntityType.CONTENT_POST,
            related_entity_id=content_post_id,
            parent_event_id=previous_event_id,
            payload={
                "platform": result.get("platform"),
                "goal_key": result.get("goal_key"),
                "business_line": result.get("business_line"),
                "template_key": result.get("template_key"),
                "caption_preview": result.get("caption_preview"),
            },
            auto_commit=False
        )

    return result


@router.post("/content-posts/{content_post_id}/approve", response_model=ContentPostOut)
def approve_content_post(content_post_id: str, db: Session = Depends(get_db)):
    return transition_content_post_status(
        content_post_id=content_post_id,
        next_status="approved",
        event_type="content_approved",
        payload={"review_decision": "approved"},
        db=db,
    )


@router.post("/content-posts/{content_post_id}/reject", response_model=ContentPostOut)
def reject_content_post(content_post_id: str, db: Session = Depends(get_db)):
    return transition_content_post_status(
        content_post_id=content_post_id,
        next_status="rejected",
        event_type="content_rejected",
        payload={"review_decision": "rejected"},
        db=db,
    )

@router.post("/content-posts/{content_post_id}/mark-shared", response_model=ContentPostOut)
def mark_content_post_shared(content_post_id: str, channel: str = Body(None), db: Session = Depends(get_db)):
    post = db.query(ContentPost).filter(ContentPost.id == content_post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Content post not found")

    if channel:
        post.channel = channel
        db.flush()

    return transition_content_post_status(
        content_post_id=content_post_id,
        next_status="shared",
        event_type=ContinuityEventType.CONTENT_SHARED,
        payload={"channel": channel or post.channel},
        db=db,
    )

@router.get("/content-posts/{content_post_id}/timeline", response_model=ContentTimelineOut)
def get_content_post_timeline(content_post_id: str, db: Session = Depends(get_db)):
    timeline = get_content_timeline(db, content_post_id)
    return timeline
