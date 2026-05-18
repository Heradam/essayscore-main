from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db
from models import InviteBind, InviteCode, User
from services.points_service import award_points
from services.auth_service import active_required, role_required
from services.password_reset_service import create_reset_request, consume_reset_code


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
        existing = User.query.filter_by(username=username).first()
        if existing:
            return jsonify({"message": f"用户 '{username}' 已存在，请直接登录。"}), 409

        invite_code = data.get("inviteCode")
        inviter_username = None
        inviter_user = None
        if invite_code:
            invite = InviteCode.query.filter_by(code=invite_code).first()
            if not invite:
                return jsonify({"message": "邀请码无效"}), 400
            inviter_user = User.query.filter_by(id=invite.inviter_user_id).first()
            inviter_username = inviter_user.username if inviter_user else None
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
        db.session.flush()

        award_points(
            username=username,
            delta=50,
            reason_code="signup.bonus",
            ref_type="signup",
            ref_id=username,
            idempotency_key=f"{username}|signup.bonus",
        )

        if inviter_username:
            if not inviter_user:
                db.session.rollback()
                return jsonify({"message": "邀请码数据异常，请联系管理员"}), 400
            existing_bind = InviteBind.query.filter_by(invitee_user_id=user.id).first()
            if not existing_bind:
                bind = InviteBind(
                    invitee_user_id=user.id,
                    inviter_user_id=inviter_user.id,
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
        user_record = User.query.filter_by(username=username).first()
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
    data = request.get_json() or {}
    username = data.get("username")
    contact = data.get("contact")

    if not username:
        return jsonify({"message": "用户名是必填项"}), 400

    try:
        user = User.query.filter_by(username=username).first()
        # 避免用户名枚举：即使用户不存在也返回统一提示。
        if not user:
            return jsonify({"message": "若账号存在，验证码已发送。"}), 200

        # 如果前端传了联系方式，则要求和用户资料一致。
        if contact:
            normalized = str(contact).strip()
            user_phone = (user.phone or "").strip()
            user_email = (user.email or "").strip().lower()
            if normalized != user_phone and normalized.lower() != user_email:
                return jsonify({"message": "联系方式校验失败"}), 400

        reset, code = create_reset_request(username=user.username, contact=contact)
        db.session.commit()

        # 当前项目没有短信/邮件网关，开发期返回验证码供前端完成闭环。
        return jsonify({
            "message": "验证码已生成，请在下一步完成重置。",
            "expiresAt": reset.expires_at.isoformat(),
            "code": code,
        }), 200
    except Exception as exc:
        db.session.rollback()
        print(f"Forgot password failed: {exc}")
        return jsonify({"message": "找回密码请求失败"}), 500


@auth_bp.route("/api/v1/auth/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    username = data.get("username")
    code = data.get("code")
    new_password = data.get("newPassword")

    if not username or not code or not new_password:
        return jsonify({"message": "用户名、验证码、新密码均为必填项"}), 400
    if len(new_password) < 6:
        return jsonify({"message": "新密码至少 6 位"}), 400

    try:
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"message": "用户名或验证码错误"}), 400

        _, err = consume_reset_code(username=username, code=code)
        if err == "invalid":
            return jsonify({"message": "用户名或验证码错误"}), 400
        if err == "expired":
            return jsonify({"message": "验证码已过期"}), 400

        user.password_hash = generate_password_hash(new_password, method="pbkdf2:sha256")
        user.must_change_password = False
        user.must_change_password_expires_at = None
        db.session.commit()
        return jsonify({"message": "密码重置成功，请重新登录。"}), 200
    except Exception as exc:
        db.session.rollback()
        print(f"Reset password failed: {exc}")
        return jsonify({"message": "密码重置失败"}), 500
