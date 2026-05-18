from flask import Blueprint, jsonify

from models import Essay, User
from services.auth_service import role_required


teacher_bp = Blueprint("teacher", __name__)


@teacher_bp.route("/api/v1/teacher/students", methods=["GET"])
@role_required("teacher", "admin")
def list_students():
    try:
        users = User.query.filter_by(role="user").order_by(User.username.asc()).all()
        return jsonify([{"username": user.username} for user in users])
    except Exception as exc:
        print(f"Database query failed: {exc}")
        return jsonify({"error": "学生列表查询失败"}), 500


@teacher_bp.route("/api/v1/teacher/history/<username>", methods=["GET"])
@role_required("teacher", "admin")
def get_student_history(username):
    try:
        student = User.query.filter_by(username=username).first()
        if not student:
            return jsonify({"error": "学生不存在"}), 404
        essays = (
            Essay.query
            .filter_by(user_id=student.id)
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
        return jsonify({"error": "学生历史查询失败"}), 500


@teacher_bp.route("/api/v1/teacher/essay/<essay_id>", methods=["GET"])
@role_required("teacher", "admin")
def get_student_essay(essay_id):
    try:
        essay = Essay.query.filter_by(id=essay_id).first()
    except Exception as exc:
        print(f"Database query failed: {exc}")
        return jsonify({"error": "作文详情查询失败"}), 500

    if not essay:
        return jsonify({"error": "作文未找到"}), 404

    response_essay = {
        "id": essay.id,
        "topic": essay.topic,
        "title": essay.title,
        "originalContent": essay.original_content,
        "score": essay.score,
        "feedback": essay.feedback or [],
        "revisedContent": essay.revised_content,
        "timestamp": essay.timestamp,
        "username": essay.user.username if essay.user else None,
    }
    return jsonify(response_essay)
