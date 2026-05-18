from datetime import datetime

from extensions import db


class LLMConfig(db.Model):
    __tablename__ = "llm_configs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    model_name = db.Column(db.String(64), nullable=False)
    provider = db.Column(db.String(64))
    api_key = db.Column(db.String(255), nullable=False)
    base_url = db.Column(db.String(255))
    quota_tokens = db.Column(db.Integer)
    is_active = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
