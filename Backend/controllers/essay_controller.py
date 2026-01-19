import json
import time
from uuid import uuid4

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from extensions import db
from models import Essay, PointsAccount
from services.auth_service import active_required
from services.llm_service import ai_score_and_refine
from services.points_service import award_points


essay_bp = Blueprint("essay", __name__)


def _normalize_feedback(feedback_value):
    if feedback_value is None:
        return []
    if isinstance(feedback_value, str):
        try:
            return json.loads(feedback_value)
        except (json.JSONDecodeError, TypeError):
            return []
    return feedback_value


@essay_bp.route("/api/v1/score", methods=["POST"])
@active_required
def score_essay():
    data = request.get_json()
    topic = data.get("topic") if data else None
    title = data.get("title", "无标题作文") if data else "无标题作文"
    content = data.get("content") if data else None

    if not topic or not content:
        return jsonify({"error": "缺少作文题目描述或内容"}), 400

    username = get_jwt_identity()
    account = PointsAccount.query.filter_by(user_username=username).first()
    if not account or account.balance < 5:
        return jsonify({"error": "积分不足"}), 402

    try:
        score, feedback, revised_content = ai_score_and_refine(topic, content)
    except Exception as exc:
        print(f"AI scoring failed: {exc}")
        return jsonify({"error": "评分服务调用失败"}), 500

    essay_id = str(uuid4())
    timestamp = int(time.time() * 1000)

    try:
        essay = Essay(
            id=essay_id,
            username=username,
            topic=topic,
            title=title,
            original_content=content,
            score=score,
            feedback=feedback,
            revised_content=revised_content,
            timestamp=timestamp,
        )
        db.session.add(essay)
        award_points(
            username=username,
            delta=-5,
            reason_code="essay.score",
            ref_type="essay",
            ref_id=essay_id,
            idempotency_key=f"{username}|essay.score|{essay_id}",
            metadata={"title": title},
        )
        db.session.commit()
    except ValueError as exc:
        db.session.rollback()
        if str(exc) == "insufficient_points":
            return jsonify({"error": "积分不足"}), 402
        return jsonify({"error": "积分扣除失败"}), 500
    except Exception as exc:
        db.session.rollback()
        print(f"Database save failed: {exc}")
        return jsonify({"error": f"数据保存失败: {exc}"}), 500

    return jsonify({
        "id": essay_id,
        "topic": topic,
        "title": title,
        "originalContent": content,
        "score": score,
        "feedback": feedback,
        "revisedContent": revised_content,
        "timestamp": timestamp
    })


@essay_bp.route("/api/v1/history/<username>", methods=["GET"])
@active_required
def get_history(username):
    if username != get_jwt_identity():
        return jsonify({"error": "权限不足"}), 403
    try:
        essays = (
            Essay.query
            .filter_by(username=username)
            .order_by(Essay.timestamp.desc())
            .all()
        )
        history_data = [
            {"id": essay.id, "title": essay.title, "timestamp": essay.timestamp}
            for essay in essays
        ]
        return jsonify(history_data)
    except Exception as exc:
        print(f"Database query failed: {exc}")
        return jsonify({"error": "历史数据查询失败"}), 500


@essay_bp.route("/api/v1/history", methods=["GET"])
@active_required
def get_my_history():
    username = get_jwt_identity()
    try:
        essays = (
            Essay.query
            .filter_by(username=username)
            .order_by(Essay.timestamp.desc())
            .all()
        )
        history_data = [
            {"id": essay.id, "title": essay.title, "timestamp": essay.timestamp}
            for essay in essays
        ]
        return jsonify(history_data)
    except Exception as exc:
        print(f"Database query failed: {exc}")
        return jsonify({"error": "历史数据查询失败"}), 500


@essay_bp.route("/api/v1/essay/<essay_id>", methods=["GET"])
@active_required
def get_essay_detail(essay_id):
    try:
        essay = Essay.query.filter_by(id=essay_id).first()
    except Exception as exc:
        print(f"Database query failed: {exc}")
        return jsonify({"error": "作文详情查询失败"}), 500

    if essay:
        if essay.username != get_jwt_identity():
            return jsonify({"error": "权限不足"}), 403
        feedback = _normalize_feedback(essay.feedback)
        response_essay = {
            "id": essay.id,
            "topic": essay.topic,
            "title": essay.title,
            "originalContent": essay.original_content,
            "score": essay.score,
            "feedback": feedback,
            "revisedContent": essay.revised_content,
            "timestamp": essay.timestamp
        }
        return jsonify(response_essay)

    return jsonify({"error": "作文未找到"}), 404
