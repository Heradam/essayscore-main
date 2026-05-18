from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from models import PointsAccount, PointsLedger, User
from services.auth_service import active_required


points_bp = Blueprint("points", __name__)


@points_bp.route("/api/v1/points/balance", methods=["GET"])
@active_required
def get_balance():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "用户不存在"}), 401
    account = PointsAccount.query.filter_by(user_id=user.id).first()
    if not account:
        return jsonify({
            "balance": 0,
            "lifetimeEarned": 0,
            "lifetimeSpent": 0,
        })
    return jsonify({
        "balance": account.balance,
        "lifetimeEarned": account.lifetime_earned,
        "lifetimeSpent": account.lifetime_spent,
    })


@points_bp.route("/api/v1/points/ledger", methods=["GET"])
@active_required
def get_ledger():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "用户不存在"}), 401
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("pageSize", 20))
    offset = (page - 1) * page_size
    query = (
        PointsLedger.query
        .filter_by(user_id=user.id)
        .order_by(PointsLedger.created_at.desc())
    )
    total = query.count()
    items = query.offset(offset).limit(page_size).all()
    return jsonify({
        "total": total,
        "items": [
            {
                "delta": item.delta,
                "reasonCode": item.reason_code,
                "refType": item.ref_type,
                "refId": item.ref_id,
                "metadata": item.meta,
                "createdAt": item.created_at.isoformat() if item.created_at else None,
            }
            for item in items
        ],
    })
