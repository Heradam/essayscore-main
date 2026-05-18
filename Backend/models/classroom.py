from datetime import datetime

from extensions import db


class ClassRoom(db.Model):
    __tablename__ = "classes"

    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    grade = db.Column(db.String(50))
    subject = db.Column(db.String(100))
    teacher_user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=False)
    invite_code = db.Column(db.String(32), unique=True, nullable=False)
    require_approval = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class ClassMember(db.Model):
    __tablename__ = "class_members"

    class_id = db.Column(db.String(36), db.ForeignKey("classes.id"), primary_key=True)
    student_user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), primary_key=True)
    group_name = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class ClassJoinRequest(db.Model):
    __tablename__ = "class_join_requests"

    id = db.Column(db.String(36), primary_key=True)
    class_id = db.Column(db.String(36), db.ForeignKey("classes.id"), nullable=False)
    student_user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(20), default="pending")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
