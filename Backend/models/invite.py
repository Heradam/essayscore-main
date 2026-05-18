from datetime import datetime

from extensions import db


class InviteCode(db.Model):
    __tablename__ = "invite_code"

    id = db.Column(db.Integer, primary_key=True)
    inviter_user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=False)
    code = db.Column(db.String(32), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)


class InviteBind(db.Model):
    __tablename__ = "invite_bind"

    id = db.Column(db.Integer, primary_key=True)
    invitee_user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), unique=True, nullable=False)
    inviter_user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=False)
    code = db.Column(db.String(32), nullable=False)
    bound_at = db.Column(db.DateTime, default=datetime.utcnow)
