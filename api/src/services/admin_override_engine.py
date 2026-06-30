from datetime import datetime


def override_user_access(db, user, new_level: str, reason: str, admin_id: str):
    """
    Controlled manual override of user activation state.

    MUST BE AUDITED.
    """

    old_level = user.access_level

    user.access_level = new_level
    user.updated_at = datetime.utcnow()

    db.flush()

    return {
        "user_id": user.id,
        "old_level": old_level,
        "new_level": new_level,
        "reason": reason,
        "admin_id": admin_id,
        "timestamp": datetime.utcnow().isoformat()
    }
