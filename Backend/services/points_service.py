from extensions import db
from models import PointsAccount, PointsLedger


def get_or_create_account(username):
    account = PointsAccount.query.filter_by(user_username=username).first()
    if account:
        return account
    account = PointsAccount(user_username=username)
    db.session.add(account)
    return account


def award_points(username, delta, reason_code, ref_type=None, ref_id=None, idempotency_key=None, metadata=None):
    if not idempotency_key:
        raise ValueError("idempotency_key is required")

    existing = PointsLedger.query.filter_by(idempotency_key=idempotency_key).first()
    if existing:
        return existing

    account = (
        PointsAccount.query
        .filter_by(user_username=username)
        .with_for_update()
        .first()
    )
    if not account:
        account = PointsAccount(user_username=username)
        db.session.add(account)
        db.session.flush()

    new_balance = account.balance + delta
    if new_balance < 0:
        raise ValueError("insufficient_points")

    ledger = PointsLedger(
        user_username=username,
        delta=delta,
        reason_code=reason_code,
        ref_type=ref_type,
        ref_id=ref_id,
        idempotency_key=idempotency_key,
        meta=metadata,
    )
    db.session.add(ledger)

    account.balance = new_balance
    if delta > 0:
        account.lifetime_earned += delta
    else:
        account.lifetime_spent += abs(delta)
    account.updated_at = db.func.now()
    db.session.add(account)

    return ledger
