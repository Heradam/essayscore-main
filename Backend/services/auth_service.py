from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from models import User


def role_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            username = get_jwt_identity()
            user = User.query.filter_by(username=username).first()
            if not user:
                return jsonify({"error": "用户不存在"}), 401
            if not user.is_active:
                return jsonify({"error": "账号已禁用"}), 403
            claims = get_jwt()
            role = claims.get("role")
            if role not in allowed_roles:
                return jsonify({"error": "权限不足"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def current_user_context():
    claims = get_jwt()
    return get_jwt_identity(), claims.get("role")


def active_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        username = get_jwt_identity()
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "用户不存在"}), 401
        if not user.is_active:
            return jsonify({"error": "账号已禁用"}), 403
        return fn(*args, **kwargs)
    return wrapper
