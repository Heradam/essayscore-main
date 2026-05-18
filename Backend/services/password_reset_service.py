from datetime import datetime, timedelta
import random

from extensions import db
from models import PasswordResetRequest, User


def generate_reset_code():
    return f"{random.randint(0, 999999):06d}"


def create_reset_request(username, contact=None, expires_minutes=10):
    user = User.query.filter_by(username=username).first()
    if not user:
        raise ValueError("user_not_found")
    now = datetime.utcnow()
    PasswordResetRequest.query.filter_by(user_id=user.id, used_at=None).update(
        {PasswordResetRequest.used_at: now}
    )
    code = generate_reset_code()
    reset = PasswordResetRequest(
        user_id=user.id,
        contact=contact or None,
        code=code,
        expires_at=now + timedelta(minutes=expires_minutes),
        created_at=now,
    )
    db.session.add(reset)
    return reset, code


def consume_reset_code(username, code):
    user = User.query.filter_by(username=username).first()
    if not user:
        return None, "invalid"
    now = datetime.utcnow()
    reset = (
        PasswordResetRequest.query
        .filter_by(user_id=user.id, code=code, used_at=None)
        .order_by(PasswordResetRequest.created_at.desc())
        .first()
    )
    if not reset:
        return None, "invalid"
    if reset.expires_at < now:
        return None, "expired"
    reset.used_at = now
    return reset, None
