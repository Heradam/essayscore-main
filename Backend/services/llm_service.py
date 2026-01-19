import json
import os

from openai import OpenAI


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

LLM_MODEL = "qwen-max"
_client = None


def _get_client():
    global _client
    if _client is not None:
        return _client
    try:
        _client = OpenAI(
            api_key=os.getenv("DASHSCOPE_API_KEY"),
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        )
    except Exception as exc:
        print(f"OpenAI Client Initialization Failed: {exc}")
        _client = None
    return _client


def ai_score_and_refine(topic, content):
    """
    调用阿里云 DashScope API (兼容 OpenAI 模式) 对作文进行评分、结构化反馈和润色。
    """
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
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object", "schema": LLM_RESPONSE_SCHEMA}
        )

        response_text = response.choices[0].message.content
        result = json.loads(response_text)

        score = result["score"]
        feedback = [
            {"type": type_key, "detail": detail_value}
            for type_key, detail_value in result["feedback"].items()
        ]
        revised_content = result["revised_content"]
        return score, feedback, revised_content

    except Exception as exc:
        print(f"LLM API Call Failed: {exc}")
        raise Exception(f"AI评分失败，请检查API Key和网络连接。错误信息: {exc}")
