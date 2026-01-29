from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db
from models import InviteBind, InviteCode, PointsAccount, User
from services.points_service import award_points
from services.auth_service import active_required, role_required


auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/v1/register", methods=["POST"])
def register_user():
    data = request.get_json()
    username = data.get("username") if data else None
    password = data.get("password") if data else None
    phone = data.get("phone") if data else None
    email = data.get("email") if data else None

    if not username or not password or not phone or not email:
        return jsonify({"message": "用户名、密码、手机号、邮箱是必填项"}), 400

    if len(username) < 3 or len(password) < 6:
        return jsonify({"message": "用户名和密码必须满足最低长度要求"}), 400
    if "@" not in email:
        return jsonify({"message": "邮箱格式不正确"}), 400
    if len(phone) < 6:
        return jsonify({"message": "手机号格式不正确"}), 400

    try:
        existing = db.session.get(User, username)
        if existing:
            return jsonify({"message": f"用户 '{username}' 已存在，请直接登录。"}), 409

        invite_code = data.get("inviteCode")
        inviter_username = None
        if invite_code:
            invite = InviteCode.query.filter_by(code=invite_code).first()
            if not invite:
                return jsonify({"message": "邀请码无效"}), 400
            inviter_username = invite.inviter_username
            if inviter_username == username:
                return jsonify({"message": "不能使用自己的邀请码"}), 400

        hashed_password = generate_password_hash(password, method="pbkdf2:sha256")
        user = User(
            username=username,
            password_hash=hashed_password,
            phone=phone,
            email=email,
        )
        db.session.add(user)

        award_points(
            username=username,
            delta=50,
            reason_code="signup.bonus",
            ref_type="signup",
            ref_id=username,
            idempotency_key=f"{username}|signup.bonus",
        )

        if inviter_username:
            existing_bind = InviteBind.query.filter_by(invitee_username=username).first()
            if not existing_bind:
                bind = InviteBind(
                    invitee_username=username,
                    inviter_username=inviter_username,
                    code=invite_code,
                )
                db.session.add(bind)
                award_points(
                    username=inviter_username,
                    delta=30,
                    reason_code="invite.reward",
                    ref_type="invite",
                    ref_id=username,
                    idempotency_key=f"{inviter_username}|invite.reward|{username}",
                    metadata={"invitee": username},
                )

        db.session.commit()

        return jsonify({
            "message": "注册成功",
            "username": username
        }), 201

    except Exception as exc:
        db.session.rollback()
        print(f"Database error during registration: {exc}")
        return jsonify({"message": "注册过程中发生数据库错误"}), 500


@auth_bp.route("/api/v1/login", methods=["POST"])
def login_user():
    data = request.get_json()
    username = data.get("username") if data else None
    password = data.get("password") if data else None

    if not username or not password:
        return jsonify({"message": "用户名和密码是必填项"}), 400

    try:
        user_record = db.session.get(User, username)
        if user_record is None:
            return jsonify({"message": "用户名或密码错误。"}), 401

        if not check_password_hash(user_record.password_hash, password):
            return jsonify({"message": "用户名或密码错误。"}), 401
        if not user_record.is_active:
            return jsonify({"message": "账号已禁用。"}), 403

        access_token = create_access_token(
            identity=user_record.username,
            additional_claims={"role": user_record.role}
        )
        return jsonify({
            "access_token": access_token,
            "user": {
                "username": user_record.username,
                "role": user_record.role,
                "must_change_password": user_record.must_change_password,
            },
            "message": "登录成功"
        }), 200

    except Exception as exc:
        print(f"Database error during login: {exc}")
        return jsonify({"message": "登录过程中发生数据库错误"}), 500


@auth_bp.route("/api/v1/admin/ping", methods=["GET"])
@role_required("admin")
def admin_ping():
    return jsonify({"message": "ok"}), 200


@auth_bp.route("/api/v1/teacher/ping", methods=["GET"])
@role_required("teacher", "admin")
def teacher_ping():
    return jsonify({"message": "ok"}), 200


@auth_bp.route("/api/v1/change-password", methods=["POST"])
@active_required
def change_password():
    data = request.get_json() or {}
    old_password = data.get("oldPassword")
    new_password = data.get("newPassword")
    if not old_password or not new_password:
        return jsonify({"message": "旧密码和新密码是必填项"}), 400

    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"message": "用户不存在"}), 404

    if not check_password_hash(user.password_hash, old_password):
        return jsonify({"message": "旧密码不正确"}), 400

    try:
        user.password_hash = generate_password_hash(new_password, method="pbkdf2:sha256")
        user.must_change_password = False
        user.must_change_password_expires_at = None
        db.session.commit()
        return jsonify({"message": "密码修改成功"}), 200
    except Exception as exc:
        db.session.rollback()
        print(f"Password update failed: {exc}")
        return jsonify({"message": "密码修改失败"}), 500


@auth_bp.route("/api/v1/auth/forgot-password", methods=["POST"])
def forgot_password():
    return jsonify({
        "message": "请联系管理员重置密码。"
    }), 200


@auth_bp.route("/api/v1/auth/reset-password", methods=["POST"])
def reset_password():
    return jsonify({
        "message": "当前不支持自助重置，请联系管理员。"
    }), 403
