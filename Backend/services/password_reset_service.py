from datetime import datetime, timedelta
import random

from extensions import db
from models import PasswordResetRequest


def generate_reset_code():
    return f"{random.randint(0, 999999):06d}"


def create_reset_request(username, contact=None, expires_minutes=10):
    now = datetime.utcnow()
    PasswordResetRequest.query.filter_by(username=username, used_at=None).update(
        {PasswordResetRequest.used_at: now}
    )
    code = generate_reset_code()
    reset = PasswordResetRequest(
        username=username,
        contact=contact or None,
        code=code,
        expires_at=now + timedelta(minutes=expires_minutes),
        created_at=now,
    )
    db.session.add(reset)
    return reset, code


def consume_reset_code(username, code):
    now = datetime.utcnow()
    reset = (
        PasswordResetRequest.query
        .filter_by(username=username, code=code, used_at=None)
        .order_by(PasswordResetRequest.created_at.desc())
        .first()
    )
    if not reset:
        return None, "invalid"
    if reset.expires_at < now:
        return None, "expired"
    reset.used_at = now
    return reset, None
