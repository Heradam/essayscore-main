import json
import os
from urllib import error, parse, request

from openai import OpenAI

from services.llm_config_service import get_active_config


LLM_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "score": {
            "type": "integer",
            "description": "作文的评分，必须是 0 到 60 之间的一个整数。"
        },
        "feedback": {
            "type": "object",
            "description": "结构化反馈，键名必须是'优点'、'不足'、'建议'，值是该类型反馈的列表。",
            "properties": {
                "优点": {
                    "type": "string",
                    "description": "文章的优点，所有内容合并成一个中文段落。"
                },
                "不足": {
                    "type": "string",
                    "description": "文章的不足之处，所有内容合并成一个中文段落。"
                },
                "建议": {
                    "type": "string",
                    "description": "针对文章的修改和改进建议，所有内容合并成一个中文段落。"
                }
            },
            "required": ["优点", "不足", "建议"],
            "additionalProperties": "false"
        },
        "revised_content": {
            "type": "string",
            "description": "经过润色和优化的文章全文。必须返回完整修改后的文章，不包含任何解释性文字。"
        }
    },
    "required": ["score", "feedback", "revised_content"]
}

DEFAULT_MODEL = "qwen-max"
DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
_clients = {}


def _normalize_base_url(base_url):
    if not base_url:
        return DEFAULT_BASE_URL
    return str(base_url).strip().rstrip("/")


def _safe_load_json(text):
    try:
        return json.loads(text)
    except Exception:
        return None


def _resolve_provider(provider, base_url):
    text = f"{provider or ''} {base_url or ''}".lower()
    if "deepseek" in text:
        return "deepseek"
    if "dashscope" in text or "aliyuncs" in text or "bailian" in text:
        return "dashscope"
    return "unknown"


def _request_json(url, api_key):
    req = request.Request(
        url,
        method="GET",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
        },
    )
    with request.urlopen(req, timeout=15) as resp:
        body = resp.read().decode("utf-8")
        return _safe_load_json(body)


def _query_deepseek_balance(api_key, base_url):
    normalized = _normalize_base_url(base_url)
    parsed = parse.urlsplit(normalized)
    root = f"{parsed.scheme}://{parsed.netloc}"
    path = parsed.path.rstrip("/")
    candidates = []
    if path:
        candidates.append(f"{root}{path}/user/balance")
    candidates.append(f"{root}/user/balance")
    if path != "/v1":
        candidates.append(f"{root}/v1/user/balance")

    last_error = None
    for url in candidates:
        try:
            payload = _request_json(url, api_key) or {}
            infos = payload.get("balance_infos") or []
            first = infos[0] if infos else {}
            return {
                "supported": True,
                "provider": "DeepSeek",
                "endpoint": url,
                "isAvailable": bool(payload.get("is_available")),
                "currency": first.get("currency"),
                "totalBalance": first.get("total_balance"),
                "grantedBalance": first.get("granted_balance"),
                "toppedUpBalance": first.get("topped_up_balance"),
            }
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            last_error = f"HTTP {exc.code}: {detail or exc.reason}"
        except Exception as exc:
            last_error = str(exc)

    raise Exception(last_error or "DeepSeek 余额查询失败")


def get_provider_balance(provider, api_key, base_url):
    detected = _resolve_provider(provider, base_url)
    if detected == "deepseek":
        return _query_deepseek_balance(api_key=api_key, base_url=base_url)
    if detected == "dashscope":
        return {
            "supported": False,
            "provider": "DashScope",
            "message": "DashScope 余额建议在百炼控制台 Billing 页面查看；本系统继续使用 quotaTokens 做模型额度管控。",
        }
    return {
        "supported": False,
        "provider": provider or "Unknown",
        "message": "当前提供商暂未接入余额 API，建议使用 quotaTokens 做额度控制。",
    }


def get_llm_runtime_context():
    config = get_active_config()
    if config:
        return {
            "source": "db",
            "model": config.model_name,
            "provider": config.provider,
            "baseUrl": _normalize_base_url(config.base_url),
            "configId": config.id,
        }
    return {
        "source": "env",
        "model": os.getenv("LLM_MODEL", DEFAULT_MODEL),
        "provider": "DashScope(default)",
        "baseUrl": _normalize_base_url(os.getenv("LLM_BASE_URL", DEFAULT_BASE_URL)),
        "configId": None,
    }


def get_active_model_name():
    config = get_active_config()
    if config:
        return config.model_name
    return os.getenv("LLM_MODEL", DEFAULT_MODEL)


def _create_client(api_key, base_url):
    return OpenAI(
        api_key=api_key,
        base_url=_normalize_base_url(base_url),
    )


def _get_client():
    config = get_active_config()
    if config:
        normalized_base = _normalize_base_url(config.base_url)
        cache_key = f"{config.id}:{normalized_base}:{config.model_name}"
        cached = _clients.get(cache_key)
        if cached:
            return cached
        try:
            client = _create_client(config.api_key, normalized_base)
            _clients[cache_key] = client
            return client
        except Exception as exc:
            print(f"OpenAI Client Initialization Failed: {exc}")
            return None

    api_key = os.getenv("DASHSCOPE_API_KEY")
    if not api_key:
        return None
    cache_key = "default"
    if cache_key in _clients:
        return _clients[cache_key]
    try:
        client = _create_client(api_key, os.getenv("LLM_BASE_URL", DEFAULT_BASE_URL))
        _clients[cache_key] = client
        return client
    except Exception as exc:
        print(f"OpenAI Client Initialization Failed: {exc}")
        return None


def _create_completion(client, model, messages, with_schema=True, max_tokens=None):
    kwargs = {
        "model": model,
        "messages": messages,
    }
    if max_tokens is not None:
        kwargs["max_tokens"] = max_tokens
    if with_schema:
        kwargs["response_format"] = {"type": "json_object", "schema": LLM_RESPONSE_SCHEMA}
    return client.chat.completions.create(**kwargs)


def _extract_text_response(response):
    try:
        return response.choices[0].message.content
    except Exception:
        return None


def _is_schema_unsupported_error(exc):
    text = str(exc).lower()
    return ("response_format" in text) or ("json_schema" in text) or ("unsupported" in text)


def _extract_usage(response):
    try:
        return getattr(response, "usage", None) or response.get("usage")
    except Exception:
        return None


def _parse_json_payload(text):
    if not text:
        raise ValueError("空响应，未返回 JSON 内容")
    try:
        return json.loads(text)
    except Exception:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            snippet = text[start:end + 1]
            return json.loads(snippet)
        raise


def _raise_llm_error(exc, runtime):
    source = runtime.get("source")
    model = runtime.get("model")
    base_url = runtime.get("baseUrl")
    raise Exception(
        f"LLM 调用失败（source={source}, model={model}, baseUrl={base_url}）: {exc}"
    )


def test_llm_connection(model_name, api_key, base_url):
    model = str(model_name or "").strip()
    key = str(api_key or "").strip()
    url = _normalize_base_url(base_url)
    if not model:
        raise ValueError("modelName 不能为空")
    if not key:
        raise ValueError("apiKey 不能为空")

    client = _create_client(key, url)
    messages = [
        {"role": "system", "content": "You are a health check bot. Reply with a compact JSON object."},
        {"role": "user", "content": "Respond with {\"ok\": true}"},
    ]
    response = _create_completion(client, model, messages, with_schema=False, max_tokens=32)
    text = _extract_text_response(response)
    usage = _extract_usage(response)
    usage_data = {
        "promptTokens": int(getattr(usage, "prompt_tokens", 0) if usage else 0),
        "completionTokens": int(getattr(usage, "completion_tokens", 0) if usage else 0),
        "totalTokens": int(getattr(usage, "total_tokens", 0) if usage else 0),
    }
    return {
        "ok": True,
        "model": model,
        "baseUrl": url,
        "usage": usage_data,
        "preview": (text or "")[:120],
    }


def ai_score_and_refine(topic, content):
    """
    调用阿里云 DashScope API (兼容 OpenAI 模式) 对作文进行评分、结构化反馈和润色。
    """
    runtime = get_llm_runtime_context()
    client = _get_client()
    if client is None:
        raise Exception("LLM client not initialized. Check DASHSCOPE_API_KEY environment variable.")

    system_prompt = (
        "你是一名专业的中文作文评分和润色专家。你的任务是根据用户提供的作文题目和内容，"
        "进行以下三项操作：1. 评分（满分 60 分）。2. 提供结构化的反馈（优点、不足、建议）。"
        "3. 对原文进行润色和优化，提升其表达和结构。"
        "**【重要格式要求】**"
        "1. **必须**严格按照提供的 JSON 格式输出结果，键名 (Key Names) 必须使用英文：'score', 'feedback', 'revised_content'。"
        "2. **尤其重要：在 'revised_content' 字段中，必须只提供经过修改的纯中文文章内容。**"
        "**严禁在 'revised_content' 中使用任何 Markdown 符号（如 #、*、**、`）、HTML 标签或额外的控制字符（如 \\\\）。**"
        "**请使用自然的中文分段换行，确保输出的文章可以直接供读者阅读和复制。**"
    )

    user_prompt = (
        "请对以下作文进行评分和润色，并严格以 JSON 格式输出结果。\n\n"
        f"作文题目：{topic}\n"
        "作文内容：\n---\n"
        f"{content}\n---"
    )

    try:
        model_name = runtime["model"]
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        try:
            response = _create_completion(client, model_name, messages, with_schema=True)
        except Exception as schema_exc:
            if not _is_schema_unsupported_error(schema_exc):
                raise
            response = _create_completion(client, model_name, messages, with_schema=False)

        response_text = _extract_text_response(response)
        usage = _extract_usage(response)
        result = _parse_json_payload(response_text)

        score = result["score"]
        feedback = [
            {"type": type_key, "detail": detail_value}
            for type_key, detail_value in result["feedback"].items()
        ]
        revised_content = result["revised_content"]
        return score, feedback, revised_content, usage

    except Exception as exc:
        print(f"LLM API Call Failed: {exc}")
        _raise_llm_error(exc, runtime)
