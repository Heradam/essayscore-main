import secrets
import os

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity

from models import InviteCode, User
from services.auth_service import active_required


invite_bp = Blueprint("invite", __name__)


def _build_invite_link(code):
    base = os.getenv("FRONTEND_BASE_URL", "").rstrip("/")
    if not base:
        base = "http://localhost:5173"
    return f"{base}/invite/signup/{code}"


def _generate_code():
    return secrets.token_urlsafe(6).replace("-", "").replace("_", "")


def _generate_unique_code():
    for _ in range(5):
        code = _generate_code()
        exists = InviteCode.query.filter_by(code=code).first()
        if not exists:
            return code
    return _generate_code()


@invite_bp.route("/api/v1/invite/code", methods=["GET"])
@active_required
def get_invite_code():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "用户不存在"}), 401
    code = InviteCode.query.filter_by(inviter_user_id=user.id).first()
    if code:
        return jsonify({
            "code": code.code,
            "inviteLink": _build_invite_link(code.code),
        })
    return jsonify({"code": None, "inviteLink": None})


@invite_bp.route("/api/v1/invite/code", methods=["POST"])
@active_required
def create_invite_code():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "用户不存在"}), 401
    existing = InviteCode.query.filter_by(inviter_user_id=user.id).first()
    if existing:
        return jsonify({
            "code": existing.code,
            "inviteLink": _build_invite_link(existing.code),
        }), 200

    code = _generate_unique_code()
    invite = InviteCode(inviter_user_id=user.id, code=code)
    try:
        from extensions import db

        db.session.add(invite)
        db.session.commit()
        return jsonify({
            "code": invite.code,
            "inviteLink": _build_invite_link(invite.code),
        }), 201
    except Exception as exc:
        from extensions import db

        db.session.rollback()
        print(f"Invite code create failed: {exc}")
        return jsonify({"error": "邀请码生成失败"}), 500


@invite_bp.route("/api/v1/invite/code/reset", methods=["POST"])
@active_required
def reset_invite_code():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "用户不存在"}), 401
    code = _generate_unique_code()
    try:
        from extensions import db

        existing = InviteCode.query.filter_by(inviter_user_id=user.id).first()
        if existing:
            existing.code = code
        else:
            existing = InviteCode(inviter_user_id=user.id, code=code)
            db.session.add(existing)
        db.session.commit()
        return jsonify({
            "code": existing.code,
            "inviteLink": _build_invite_link(existing.code),
        }), 200
    except Exception as exc:
        from extensions import db

        db.session.rollback()
        print(f"Invite code reset failed: {exc}")
        return jsonify({"error": "邀请码重置失败"}), 500
