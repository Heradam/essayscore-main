from datetime import datetime

from extensions import db


class User(db.Model):
    __tablename__ = "users"

    username = db.Column(db.String(100), primary_key=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False, default="user")
    is_active = db.Column(db.Boolean, default=True)
    must_change_password = db.Column(db.Boolean, default=False)
    must_change_password_expires_at = db.Column(db.DateTime)
    grade = db.Column(db.String(20))
    subject = db.Column(db.String(20))
    teacher_id = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
