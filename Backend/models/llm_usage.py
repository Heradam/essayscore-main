from datetime import datetime

from extensions import db


class LLMUsageLog(db.Model):
    __tablename__ = "llm_usage_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    model = db.Column(db.String(64), nullable=False)
    prompt_tokens = db.Column(db.Integer, nullable=False, default=0)
    completion_tokens = db.Column(db.Integer, nullable=False, default=0)
    total_tokens = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
