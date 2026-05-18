from datetime import datetime

from sqlalchemy import func

from extensions import db
from models import LLMUsageLog


def _read_usage_value(usage, key):
    if usage is None:
        return 0
    if isinstance(usage, dict):
        return usage.get(key) or 0
    return getattr(usage, key, 0) or 0


def record_llm_usage(model, usage):
    if not usage:
        return None
    prompt_tokens = int(_read_usage_value(usage, "prompt_tokens"))
    completion_tokens = int(_read_usage_value(usage, "completion_tokens"))
    total_tokens = int(_read_usage_value(usage, "total_tokens") or prompt_tokens + completion_tokens)
    log = LLMUsageLog(
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
    )
    db.session.add(log)
    return log


def get_month_usage(model, year, month):
    start = datetime(year, month, 1)
    if month == 12:
        end = datetime(year + 1, 1, 1)
    else:
        end = datetime(year, month + 1, 1)
    totals = db.session.query(
        func.coalesce(func.sum(LLMUsageLog.total_tokens), 0),
        func.max(LLMUsageLog.created_at),
    ).filter(
        LLMUsageLog.model == model,
        LLMUsageLog.created_at >= start,
        LLMUsageLog.created_at < end,
    ).first()
    total_tokens = int(totals[0] or 0)
    last_used_at = totals[1]
    return total_tokens, last_used_at


def get_month_usage_map(models, year, month):
    if not models:
        return {}
    start = datetime(year, month, 1)
    if month == 12:
        end = datetime(year + 1, 1, 1)
    else:
        end = datetime(year, month + 1, 1)
    rows = db.session.query(
        LLMUsageLog.model,
        func.coalesce(func.sum(LLMUsageLog.total_tokens), 0),
        func.max(LLMUsageLog.created_at),
    ).filter(
        LLMUsageLog.model.in_(models),
        LLMUsageLog.created_at >= start,
        LLMUsageLog.created_at < end,
    ).group_by(LLMUsageLog.model).all()
    result = {model: {"usedTokens": 0, "lastUsedAt": None} for model in models}
    for model, used_tokens, last_used_at in rows:
        result[model] = {
            "usedTokens": int(used_tokens or 0),
            "lastUsedAt": last_used_at,
        }
    return result
