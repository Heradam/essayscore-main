from datetime import datetime, timedelta
import os

from flask import Blueprint, jsonify, request
from sqlalchemy import func
from werkzeug.security import generate_password_hash

from extensions import db
from models import Essay, PointsAccount, PointsLedger, User
from services.points_service import award_points
from services.auth_service import role_required
from services.llm_usage_service import get_month_usage
from services.llm_service import get_active_model_name
from services.llm_config_service import get_active_config, set_active_config, to_safe_dict
from models import LLMConfig, LLMUsageLog


admin_bp = Blueprint("admin", __name__)

ALLOWED_ROLES = {"user", "teacher", "admin"}
ALLOWED_SUBJECTS = {"语文", "英语"}
ALLOWED_GRADES = {str(i) for i in range(1, 13)}


def _normalize_grade(value):
    if value is None or value == "":
        return None
    grade = str(value).strip()
    if grade not in ALLOWED_GRADES:
        return None
    return grade


def _normalize_subject(value):
    if value is None or value == "":
        return None
    if value not in ALLOWED_SUBJECTS:
        return None
    return value


@admin_bp.route("/api/v1/admin/users", methods=["GET"])
@role_required("admin")
def list_users():
    query = request.args.get("query", "").strip()
    role = request.args.get("role", "").strip()

    try:
        q = User.query
        if query:
            q = q.filter(User.username.like(f"%{query}%"))
        if role:
            q = q.filter(User.role == role)
        users = q.order_by(User.created_at.desc()).all()
        return jsonify([
            {
                "username": user.username,
                "role": user.role,
                "isActive": user.is_active,
                "mustChangePassword": user.must_change_password,
                "grade": user.grade,
                "subject": user.subject,
                "teacherId": user.teacher_id,
                "createdAt": user.created_at.isoformat() if user.created_at else None,
            }
            for user in users
        ])
    except Exception as exc:
        print(f"Database query failed: {exc}")
        return jsonify({"error": "用户列表查询失败"}), 500


@admin_bp.route("/api/v1/admin/users/<username>", methods=["PATCH"])
@role_required("admin")
def update_user(username):
    data = request.get_json() or {}
    try:
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "用户不存在"}), 404

        if "role" in data:
            role = data.get("role")
            if role not in ALLOWED_ROLES:
                return jsonify({"error": "角色不合法"}), 400
            user.role = role
        if "isActive" in data:
            user.is_active = bool(data.get("isActive"))
        if "grade" in data:
            grade = _normalize_grade(data.get("grade"))
            if data.get("grade") and grade is None:
                return jsonify({"error": "年级不合法"}), 400
            user.grade = grade
        if "subject" in data:
            subject = _normalize_subject(data.get("subject"))
            if data.get("subject") and subject is None:
                return jsonify({"error": "学科不合法"}), 400
            user.subject = subject
        if "teacherId" in data:
            user.teacher_id = data.get("teacherId") or None

        db.session.commit()
        return jsonify({"message": "更新成功"}), 200
    except Exception as exc:
        db.session.rollback()
        print(f"Database update failed: {exc}")
        return jsonify({"error": "用户更新失败"}), 500


@admin_bp.route("/api/v1/admin/users/<username>/reset-password", methods=["POST"])
@role_required("admin")
def reset_password(username):
    try:
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "用户不存在"}), 404

        user.password_hash = generate_password_hash("123456", method="pbkdf2:sha256")
        user.must_change_password = True
        user.must_change_password_expires_at = datetime.utcnow() + timedelta(days=7)
        db.session.commit()
        return jsonify({
            "message": "密码已重置为 123456，下次登录需修改。",
            "expiresAt": user.must_change_password_expires_at.isoformat(),
        }), 200
    except Exception as exc:
        db.session.rollback()
        print(f"Password reset failed: {exc}")
        return jsonify({"error": "密码重置失败"}), 500


@admin_bp.route("/api/v1/admin/teachers", methods=["GET"])
@role_required("admin")
def list_teachers():
    try:
        teachers = User.query.filter_by(role="teacher").order_by(User.created_at.desc()).all()
        return jsonify([
            {
                "username": user.username,
                "grade": user.grade,
                "subject": user.subject,
                "teacherId": user.teacher_id,
                "isActive": user.is_active,
            }
            for user in teachers
        ])
    except Exception as exc:
        print(f"Database query failed: {exc}")
        return jsonify({"error": "教师列表查询失败"}), 500


@admin_bp.route("/api/v1/admin/points/adjust", methods=["POST"])
@role_required("admin")
def adjust_points():
    data = request.get_json() or {}
    username = data.get("username")
    delta = data.get("delta")
    note = data.get("note")
    if not username or delta is None:
        return jsonify({"error": "用户名和积分变动是必填项"}), 400
    if not isinstance(delta, int):
        return jsonify({"error": "积分变动必须为整数"}), 400
    if not note:
        return jsonify({"error": "备注不能为空"}), 400

    try:
        award_points(
            username=username,
            delta=delta,
            reason_code="admin.adjust",
            ref_type="admin",
            ref_id=username,
            idempotency_key=f"admin.adjust|{username}|{delta}|{note}",
            metadata={"note": note},
        )
        db.session.commit()
        return jsonify({"message": "调整成功"}), 200
    except ValueError as exc:
        db.session.rollback()
        if str(exc) == "insufficient_points":
            return jsonify({"error": "积分不足"}), 400
        return jsonify({"error": "积分调整失败"}), 500
    except Exception as exc:
        db.session.rollback()
        print(f"Points adjust failed: {exc}")
        return jsonify({"error": "积分调整失败"}), 500


@admin_bp.route("/api/v1/admin/points/accounts", methods=["GET"])
@role_required("admin")
def list_points_accounts():
    query = request.args.get("query", "").strip()

    try:
        q = db.session.query(User.username, PointsAccount.balance).outerjoin(
            PointsAccount,
            PointsAccount.user_username == User.username,
        )
        if query:
            q = q.filter(User.username.like(f"%{query}%"))
        results = q.order_by(User.created_at.desc()).all()
        return jsonify([
            {
                "username": username,
                "balance": balance if balance is not None else 0,
            }
            for username, balance in results
        ])
    except Exception as exc:
        print(f"Points account query failed: {exc}")
        return jsonify({"error": "积分账户查询失败"}), 500


@admin_bp.route("/api/v1/admin/dashboard", methods=["GET"])
@role_required("admin")
def admin_dashboard():
    try:
        now = datetime.utcnow()
        cutoff = now - timedelta(days=7)
        cutoff_ms = int(cutoff.timestamp() * 1000)

        total_users = User.query.count()
        total_students = User.query.filter_by(role="user").count()
        total_teachers = User.query.filter_by(role="teacher").count()
        disabled_users = User.query.filter_by(is_active=False).count()
        new_users_7d = User.query.filter(User.created_at >= cutoff).count()

        submissions_7d = Essay.query.filter(Essay.timestamp >= cutoff_ms).count()
        active_submitters_7d = (
            db.session.query(func.count(func.distinct(Essay.username)))
            .filter(Essay.timestamp >= cutoff_ms)
            .scalar()
        ) or 0

        points_earned = db.session.query(func.coalesce(func.sum(PointsAccount.lifetime_earned), 0)).scalar() or 0
        points_spent = db.session.query(func.coalesce(func.sum(PointsAccount.lifetime_spent), 0)).scalar() or 0
        points_adjust_7d = (
            PointsLedger.query
            .filter(PointsLedger.reason_code == "admin.adjust", PointsLedger.created_at >= cutoff)
            .count()
        )

        return jsonify({
            "users": {
                "total": total_users,
                "students": total_students,
                "teachers": total_teachers,
                "disabled": disabled_users,
                "new7d": new_users_7d,
            },
            "activity": {
                "activeSubmitters7d": active_submitters_7d,
                "submissions7d": submissions_7d,
            },
            "points": {
                "totalEarned": points_earned,
                "totalSpent": points_spent,
                "adjustments7d": points_adjust_7d,
            },
        })
    except Exception as exc:
        print(f"Dashboard query failed: {exc}")
        return jsonify({"error": "仪表盘数据查询失败"}), 500


@admin_bp.route("/api/v1/admin/llm/status", methods=["GET"])
@role_required("admin")
def llm_status():
    try:
        now = datetime.utcnow()
        model_name = get_active_model_name()
        used_tokens, last_used_at = get_month_usage(model_name, now.year, now.month)
        quota = os.getenv("LLM_TOKEN_QUOTA")
        quota_value = int(quota) if quota and quota.isdigit() else None
        remaining = None
        if quota_value is not None:
            remaining = max(quota_value - used_tokens, 0)
        return jsonify({
            "model": model_name,
            "month": f"{now.year}-{now.month:02d}",
            "usedTokens": used_tokens,
            "quotaTokens": quota_value,
            "remainingTokens": remaining,
            "lastUsedAt": last_used_at.isoformat() if last_used_at else None,
        }), 200
    except Exception as exc:
        print(f"LLM status query failed: {exc}")
        return jsonify({"error": "LLM 状态查询失败"}), 500


@admin_bp.route("/api/v1/admin/llm/configs", methods=["GET"])
@role_required("admin")
def list_llm_configs():
    try:
        configs = LLMConfig.query.order_by(LLMConfig.created_at.desc()).all()
        return jsonify([to_safe_dict(item) for item in configs]), 200
    except Exception as exc:
        print(f"LLM config list failed: {exc}")
        return jsonify({"error": "LLM 配置查询失败"}), 500


@admin_bp.route("/api/v1/admin/llm/configs", methods=["POST"])
@role_required("admin")
def create_llm_config():
    data = request.get_json() or {}
    model_name = data.get("modelName")
    provider = data.get("provider")
    api_key = data.get("apiKey")
    base_url = data.get("baseUrl")
    is_active = bool(data.get("isActive"))

    if not model_name or not api_key:
        return jsonify({"error": "modelName 和 apiKey 为必填项"}), 400

    try:
        config = LLMConfig(
            model_name=model_name,
            provider=provider,
            api_key=api_key,
            base_url=base_url,
            is_active=False,
        )
        db.session.add(config)
        db.session.flush()
        if is_active:
            set_active_config(config)
        db.session.commit()
        return jsonify(to_safe_dict(config)), 201
    except Exception as exc:
        db.session.rollback()
        print(f"LLM config create failed: {exc}")
        return jsonify({"error": "LLM 配置创建失败"}), 500


@admin_bp.route("/api/v1/admin/llm/configs/<int:config_id>", methods=["PATCH"])
@role_required("admin")
def update_llm_config(config_id):
    data = request.get_json() or {}
    try:
        config = LLMConfig.query.get(config_id)
        if not config:
            return jsonify({"error": "LLM 配置不存在"}), 404

        if "modelName" in data:
            config.model_name = data.get("modelName") or config.model_name
        if "provider" in data:
            config.provider = data.get("provider")
        if "apiKey" in data and data.get("apiKey"):
            config.api_key = data.get("apiKey")
        if "baseUrl" in data:
            config.base_url = data.get("baseUrl")
        if data.get("isActive"):
            set_active_config(config)
        db.session.commit()
        return jsonify(to_safe_dict(config)), 200
    except Exception as exc:
        db.session.rollback()
        print(f"LLM config update failed: {exc}")
        return jsonify({"error": "LLM 配置更新失败"}), 500


@admin_bp.route("/api/v1/admin/llm/configs/<int:config_id>/activate", methods=["POST"])
@role_required("admin")
def activate_llm_config(config_id):
    try:
        config = LLMConfig.query.get(config_id)
        if not config:
            return jsonify({"error": "LLM 配置不存在"}), 404
        set_active_config(config)
        db.session.commit()
        return jsonify(to_safe_dict(config)), 200
    except Exception as exc:
        db.session.rollback()
        print(f"LLM config activate failed: {exc}")
        return jsonify({"error": "LLM 配置激活失败"}), 500


@admin_bp.route("/api/v1/admin/llm/configs/<int:config_id>", methods=["DELETE"])
@role_required("admin")
def delete_llm_config(config_id):
    try:
        config = LLMConfig.query.get(config_id)
        if not config:
            return jsonify({"error": "LLM 配置不存在"}), 404
        if config.is_active:
            return jsonify({"error": "不能删除当前使用中的模型"}), 400
        used_count = (
            db.session.query(func.count(LLMUsageLog.id))
            .filter(LLMUsageLog.model == config.model_name)
            .scalar()
        ) or 0
        if used_count > 0:
            return jsonify({"error": "该模型已有使用记录，禁止删除"}), 400
        db.session.delete(config)
        db.session.commit()
        return jsonify({"message": "删除成功"}), 200
    except Exception as exc:
        db.session.rollback()
        print(f"LLM config delete failed: {exc}")
        return jsonify({"error": "LLM 配置删除失败"}), 500
