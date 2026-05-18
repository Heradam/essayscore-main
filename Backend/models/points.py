from datetime import datetime

from extensions import db


class PointsAccount(db.Model):
    __tablename__ = "points_account"

    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), unique=True, nullable=False)
    balance = db.Column(db.Integer, default=0, nullable=False)
    lifetime_earned = db.Column(db.Integer, default=0, nullable=False)
    lifetime_spent = db.Column(db.Integer, default=0, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

    id = db.Column(db.Integer, primary_key=True)


class PointsLedger(db.Model):
    __tablename__ = "points_ledger"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=False)
    delta = db.Column(db.Integer, nullable=False)
    reason_code = db.Column(db.String(100), nullable=False)
    ref_type = db.Column(db.String(50))
    ref_id = db.Column(db.String(100))
    idempotency_key = db.Column(db.String(255), unique=True, nullable=False)
    meta = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
