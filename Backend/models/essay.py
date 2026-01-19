from sqlalchemy.dialects.mysql import LONGTEXT

from extensions import db


class Essay(db.Model):
    __tablename__ = "essays"

    id = db.Column(db.String(36), primary_key=True)
    username = db.Column(db.String(100), db.ForeignKey("users.username"), nullable=False)
    topic = db.Column(db.Text, nullable=False)
    title = db.Column(db.String(255))
    original_content = db.Column(LONGTEXT, nullable=False)
    score = db.Column(db.Integer)
    feedback = db.Column(db.JSON)
    revised_content = db.Column(LONGTEXT)
    timestamp = db.Column(db.BigInteger)

    user = db.relationship("User", backref=db.backref("essays", cascade="all, delete-orphan"))
