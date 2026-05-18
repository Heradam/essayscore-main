import json
import time
from datetime import datetime
from uuid import uuid4

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from extensions import db
from models import Essay, PointsAccount, User
from services.auth_service import active_required
from services.llm_service import ai_score_and_refine, get_active_model_name
from services.llm_usage_service import get_month_usage, record_llm_usage
from services.llm_config_service import get_active_config
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


def _build_user_feedback_payload(essay):
    return {
        "userRating": float(essay.user_rating) if essay.user_rating is not None else None,
        "userReview": essay.user_review,
        "userReviewedAt": essay.user_reviewed_at.isoformat() if essay.user_reviewed_at else None,
    }


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
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "用户不存在"}), 401
    account = PointsAccount.query.filter_by(user_id=user.id).first()
    if not account or account.balance < 5:
        return jsonify({"error": "积分不足"}), 402
    active_config = get_active_config()
    if active_config and active_config.quota_tokens is not None:
        now = datetime.utcnow()
        used_tokens, _ = get_month_usage(active_config.model_name, now.year, now.month)
        if used_tokens >= active_config.quota_tokens:
            return jsonify({"error": "当前模型额度已用尽，请联系管理员切换模型或调整额度"}), 429

    try:
        score, feedback, revised_content, usage = ai_score_and_refine(topic, content)
    except Exception as exc:
        print(f"AI scoring failed: {exc}")
        return jsonify({"error": "评分服务调用失败"}), 500

    essay_id = str(uuid4())
    timestamp = int(time.time() * 1000)

    try:
        essay = Essay(
            id=essay_id,
            user_id=user.id,
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
        record_llm_usage(get_active_model_name(), usage or {})
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
        "timestamp": timestamp,
        **_build_user_feedback_payload(essay),
    })


@essay_bp.route("/api/v1/history/<username>", methods=["GET"])
@active_required
def get_history(username):
    if username != get_jwt_identity():
        return jsonify({"error": "权限不足"}), 403
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "用户不存在"}), 404
    try:
        essays = (
            Essay.query
            .filter(Essay.user_id == user.id)
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
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "用户不存在"}), 401
    try:
        essays = (
            Essay.query
            .filter(Essay.user_id == user.id)
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
        username = get_jwt_identity()
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "用户不存在"}), 401
        if essay.user_id != user.id:
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
            "timestamp": essay.timestamp,
            **_build_user_feedback_payload(essay),
        }
        return jsonify(response_essay)

    return jsonify({"error": "作文未找到"}), 404


@essay_bp.route("/api/v1/essay/<essay_id>/evaluation", methods=["PATCH"])
@active_required
def save_essay_evaluation(essay_id):
    data = request.get_json() or {}
    rating = data.get("rating")
    review = data.get("review")

    try:
        rating_value = float(rating)
    except (TypeError, ValueError):
        return jsonify({"error": "评分反馈星级必须为 0.5 到 5 的 0.5 递增值"}), 400

    scaled_rating = rating_value * 2
    if rating_value < 0.5 or rating_value > 5 or abs(scaled_rating - round(scaled_rating)) > 1e-9:
        return jsonify({"error": "评分反馈星级必须为 0.5 到 5 的 0.5 递增值"}), 400

    review_text = str(review or "").strip()
    if len(review_text) > 500:
        return jsonify({"error": "文字评价不能超过 500 字"}), 400

    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "用户不存在"}), 401

    essay = Essay.query.filter_by(id=essay_id).first()
    if not essay:
        return jsonify({"error": "作文未找到"}), 404
    if essay.user_id != user.id:
        return jsonify({"error": "权限不足"}), 403

    try:
        essay.user_rating = rating_value
        essay.user_review = review_text or None
        essay.user_reviewed_at = datetime.utcnow()
        db.session.commit()
        return jsonify({
            "message": "评分效果反馈已保存",
            "evaluation": _build_user_feedback_payload(essay),
        }), 200
    except Exception as exc:
        db.session.rollback()
        print(f"Essay evaluation save failed: {exc}")
        return jsonify({"error": "评分效果反馈保存失败"}), 500
