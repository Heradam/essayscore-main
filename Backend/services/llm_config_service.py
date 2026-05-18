from extensions import db
from models import LLMConfig


def mask_key(value):
    if not value:
        return ""
    if len(value) <= 8:
        return "*" * len(value)
    return f"{value[:4]}****{value[-4:]}"


def get_active_config():
    return LLMConfig.query.filter_by(is_active=True).first()


def set_active_config(config):
    LLMConfig.query.update({LLMConfig.is_active: False})
    config.is_active = True
    db.session.add(config)


def to_safe_dict(config):
    return {
        "id": config.id,
        "modelName": config.model_name,
        "provider": config.provider,
        "baseUrl": config.base_url,
        "quotaTokens": config.quota_tokens,
        "isActive": config.is_active,
        "apiKeyMasked": mask_key(config.api_key),
        "createdAt": config.created_at.isoformat() if config.created_at else None,
    }
