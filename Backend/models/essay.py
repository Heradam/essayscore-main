from datetime import datetime

from sqlalchemy.dialects.mysql import LONGTEXT

from extensions import db


class Essay(db.Model):
    __tablename__ = "essays"

    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=False)
    topic = db.Column(db.Text, nullable=False)
    title = db.Column(db.String(255))
    original_content = db.Column(LONGTEXT, nullable=False)
    score = db.Column(db.Integer)
    feedback = db.Column(db.JSON)
    revised_content = db.Column(LONGTEXT)
    timestamp = db.Column(db.BigInteger)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    user_rating = db.Column(db.Numeric(2, 1))
    user_review = db.Column(db.Text)
    user_reviewed_at = db.Column(db.DateTime)

    user = db.relationship("User", backref=db.backref("essays", cascade="all, delete-orphan"), foreign_keys=[user_id])
