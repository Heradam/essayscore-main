from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from sqlalchemy import func
from werkzeug.security import generate_password_hash

from extensions import db
from models import Essay, PointsAccount, PointsLedger, User
from services.points_service import award_points
from services.auth_service import role_required


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
    data = request.get_json() or {}
    provided_password = data.get("password")
    if not provided_password:
        return jsonify({"error": "新密码不能为空"}), 400

    try:
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "用户不存在"}), 404

        user.password_hash = generate_password_hash(provided_password, method="pbkdf2:sha256")
        user.must_change_password = True
        user.must_change_password_expires_at = datetime.utcnow() + timedelta(days=7)
        db.session.commit()
        return jsonify({
            "message": "密码已重置",
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
