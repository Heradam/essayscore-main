import os
import secrets
from uuid import uuid4

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity

from extensions import db
from models import ClassJoinRequest, ClassMember, ClassRoom, User
from services.auth_service import active_required, role_required


class_bp = Blueprint("classes", __name__)


def _build_invite_link(invite_code):
    base = os.getenv("FRONTEND_BASE_URL") or request.host_url.rstrip("/")
    return f"{base}/invite/{invite_code}"


def _generate_unique_invite_code():
    for _ in range(5):
        code = secrets.token_urlsafe(6).replace("-", "").replace("_", "")
        exists = ClassRoom.query.filter_by(invite_code=code).first()
        if not exists:
            return code
    return uuid4().hex


def _get_teacher_class_or_404(class_id, teacher_username):
    teacher = User.query.filter_by(username=teacher_username).first()
    if not teacher:
        return None
    classroom = ClassRoom.query.filter_by(id=class_id, teacher_user_id=teacher.id).first()
    return classroom


@class_bp.route("/api/v1/teacher/classes", methods=["POST"])
@role_required("teacher", "admin")
def create_class():
    data = request.get_json() or {}
    name = data.get("name")
    grade = data.get("grade")
    subject = data.get("subject")
    require_approval = data.get("requireApproval", True)
    if not name:
        return jsonify({"error": "班级名不能为空"}), 400

    teacher_username = get_jwt_identity()
    teacher = User.query.filter_by(username=teacher_username).first()
    if not teacher:
        return jsonify({"error": "用户不存在"}), 401
    invite_code = _generate_unique_invite_code()

    classroom = ClassRoom(
        id=str(uuid4()),
        name=name,
        grade=grade,
        subject=subject,
        teacher_user_id=teacher.id,
        invite_code=invite_code,
        require_approval=bool(require_approval),
    )
    try:
        db.session.add(classroom)
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        print(f"Database save failed: {exc}")
        return jsonify({"error": "班级创建失败"}), 500

    return jsonify({
        "id": classroom.id,
        "name": classroom.name,
        "grade": classroom.grade,
        "subject": classroom.subject,
        "inviteCode": classroom.invite_code,
        "inviteLink": _build_invite_link(classroom.invite_code),
        "requireApproval": classroom.require_approval,
    }), 201


@class_bp.route("/api/v1/teacher/classes", methods=["GET"])
@role_required("teacher", "admin")
def list_classes():
    teacher_username = get_jwt_identity()
    teacher = User.query.filter_by(username=teacher_username).first()
    if not teacher:
        return jsonify({"error": "用户不存在"}), 401
    try:
        classes = (
            ClassRoom.query
            .filter_by(teacher_user_id=teacher.id)
            .order_by(ClassRoom.created_at.desc())
            .all()
        )
        result = []
        for classroom in classes:
            result.append({
                "id": classroom.id,
                "name": classroom.name,
                "grade": classroom.grade,
                "subject": classroom.subject,
                "inviteCode": classroom.invite_code,
                "inviteLink": _build_invite_link(classroom.invite_code),
                "requireApproval": classroom.require_approval,
            })
        return jsonify(result)
    except Exception as exc:
        print(f"Database query failed: {exc}")
        return jsonify({"error": "班级列表查询失败"}), 500


@class_bp.route("/api/v1/teacher/classes/<class_id>", methods=["PATCH"])
@role_required("teacher", "admin")
def update_class(class_id):
    teacher_username = get_jwt_identity()
    classroom = _get_teacher_class_or_404(class_id, teacher_username)
    if not classroom:
        return jsonify({"error": "班级未找到"}), 404

    data = request.get_json() or {}
    if "name" in data:
        classroom.name = data["name"]
    if "grade" in data:
        classroom.grade = data["grade"]
    if "subject" in data:
        classroom.subject = data["subject"]
    if "requireApproval" in data:
        classroom.require_approval = bool(data["requireApproval"])

    try:
        db.session.commit()
        return jsonify({"message": "更新成功"}), 200
    except Exception as exc:
        db.session.rollback()
        print(f"Database update failed: {exc}")
        return jsonify({"error": "班级更新失败"}), 500


@class_bp.route("/api/v1/teacher/classes/<class_id>/invite", methods=["POST"])
@role_required("teacher", "admin")
def regenerate_invite(class_id):
    teacher_username = get_jwt_identity()
    classroom = _get_teacher_class_or_404(class_id, teacher_username)
    if not classroom:
        return jsonify({"error": "班级未找到"}), 404

    classroom.invite_code = _generate_unique_invite_code()
    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        print(f"Database update failed: {exc}")
        return jsonify({"error": "邀请码更新失败"}), 500

    return jsonify({
        "inviteCode": classroom.invite_code,
        "inviteLink": _build_invite_link(classroom.invite_code),
    })


@class_bp.route("/api/v1/teacher/classes/<class_id>/members", methods=["GET"])
@role_required("teacher", "admin")
def list_members(class_id):
    teacher_username = get_jwt_identity()
    classroom = _get_teacher_class_or_404(class_id, teacher_username)
    if not classroom:
        return jsonify({"error": "班级未找到"}), 404

    try:
        members = (
            db.session.query(ClassMember, User.username)
            .join(User, User.id == ClassMember.student_user_id)
            .filter(ClassMember.class_id == class_id)
            .all()
        )
        return jsonify([
            {"username": username, "group": member.group_name}
            for member, username in members
        ])
    except Exception as exc:
        print(f"Database query failed: {exc}")
        return jsonify({"error": "学生名单查询失败"}), 500


@class_bp.route("/api/v1/teacher/classes/<class_id>/members/<username>", methods=["PATCH"])
@role_required("teacher", "admin")
def update_member_group(class_id, username):
    teacher_username = get_jwt_identity()
    classroom = _get_teacher_class_or_404(class_id, teacher_username)
    if not classroom:
        return jsonify({"error": "班级未找到"}), 404

    data = request.get_json() or {}
    group_name = data.get("group")
    try:
        student = User.query.filter_by(username=username).first()
        if not student:
            return jsonify({"error": "学生不存在"}), 404
        member = ClassMember.query.filter_by(class_id=class_id, student_user_id=student.id).first()
        if not member:
            return jsonify({"error": "学生不在班级中"}), 404
        member.group_name = group_name
        db.session.commit()
        return jsonify({"message": "分组更新成功"}), 200
    except Exception as exc:
        db.session.rollback()
        print(f"Database update failed: {exc}")
        return jsonify({"error": "分组更新失败"}), 500


@class_bp.route("/api/v1/teacher/classes/<class_id>/members/<username>", methods=["DELETE"])
@role_required("teacher", "admin")
def remove_member(class_id, username):
    teacher_username = get_jwt_identity()
    classroom = _get_teacher_class_or_404(class_id, teacher_username)
    if not classroom:
        return jsonify({"error": "班级未找到"}), 404

    try:
        student = User.query.filter_by(username=username).first()
        if not student:
            return jsonify({"error": "学生不存在"}), 404
        member = ClassMember.query.filter_by(class_id=class_id, student_user_id=student.id).first()
        if not member:
            return jsonify({"error": "学生不在班级中"}), 404
        db.session.delete(member)
        db.session.commit()
        return jsonify({"message": "移除成功"}), 200
    except Exception as exc:
        db.session.rollback()
        print(f"Database delete failed: {exc}")
        return jsonify({"error": "移除失败"}), 500


@class_bp.route("/api/v1/teacher/classes/<class_id>/requests", methods=["GET"])
@role_required("teacher", "admin")
def list_join_requests(class_id):
    teacher_username = get_jwt_identity()
    classroom = _get_teacher_class_or_404(class_id, teacher_username)
    if not classroom:
        return jsonify({"error": "班级未找到"}), 404

    try:
        requests_ = (
            db.session.query(ClassJoinRequest, User.username)
            .join(User, User.id == ClassJoinRequest.student_user_id)
            .filter(ClassJoinRequest.class_id == class_id, ClassJoinRequest.status == "pending")
            .order_by(ClassJoinRequest.created_at.desc())
            .all()
        )
        return jsonify([{"username": username, "id": item.id} for item, username in requests_])
    except Exception as exc:
        print(f"Database query failed: {exc}")
        return jsonify({"error": "申请列表查询失败"}), 500


@class_bp.route("/api/v1/teacher/classes/<class_id>/requests/<username>/approve", methods=["POST"])
@role_required("teacher", "admin")
def approve_request(class_id, username):
    teacher_username = get_jwt_identity()
    classroom = _get_teacher_class_or_404(class_id, teacher_username)
    if not classroom:
        return jsonify({"error": "班级未找到"}), 404

    try:
        student = User.query.filter_by(username=username).first()
        if not student:
            return jsonify({"error": "学生不存在"}), 404
        req = ClassJoinRequest.query.filter_by(class_id=class_id, student_user_id=student.id, status="pending").first()
        if not req:
            return jsonify({"error": "申请不存在"}), 404
        member = ClassMember.query.filter_by(class_id=class_id, student_user_id=student.id).first()
        if not member:
            member = ClassMember(class_id=class_id, student_user_id=student.id)
            db.session.add(member)
        req.status = "approved"
        db.session.commit()
        return jsonify({"message": "已通过"}), 200
    except Exception as exc:
        db.session.rollback()
        print(f"Database update failed: {exc}")
        return jsonify({"error": "审核失败"}), 500


@class_bp.route("/api/v1/teacher/classes/<class_id>/requests/<username>/reject", methods=["POST"])
@role_required("teacher", "admin")
def reject_request(class_id, username):
    teacher_username = get_jwt_identity()
    classroom = _get_teacher_class_or_404(class_id, teacher_username)
    if not classroom:
        return jsonify({"error": "班级未找到"}), 404

    try:
        student = User.query.filter_by(username=username).first()
        if not student:
            return jsonify({"error": "学生不存在"}), 404
        req = ClassJoinRequest.query.filter_by(class_id=class_id, student_user_id=student.id, status="pending").first()
        if not req:
            return jsonify({"error": "申请不存在"}), 404
        req.status = "rejected"
        db.session.commit()
        return jsonify({"message": "已拒绝"}), 200
    except Exception as exc:
        db.session.rollback()
        print(f"Database update failed: {exc}")
        return jsonify({"error": "审核失败"}), 500


@class_bp.route("/api/v1/classes/join", methods=["POST"])
@active_required
def join_class():
    data = request.get_json() or {}
    code = data.get("code")
    if not code:
        return jsonify({"error": "邀请码不能为空"}), 400

    claims = get_jwt()
    role = claims.get("role")
    if role and role != "user":
        return jsonify({"error": "只有学生可以加入班级"}), 403

    classroom = ClassRoom.query.filter_by(invite_code=code).first()
    if not classroom:
        return jsonify({"error": "邀请码无效"}), 404

    username = get_jwt_identity()
    student = User.query.filter_by(username=username).first()
    if not student:
        return jsonify({"error": "用户不存在"}), 401
    existing = ClassMember.query.filter_by(class_id=classroom.id, student_user_id=student.id).first()
    if existing:
        return jsonify({"message": "已加入该班级"}), 200

    if classroom.require_approval:
        pending = ClassJoinRequest.query.filter_by(
            class_id=classroom.id,
            student_user_id=student.id,
            status="pending"
        ).first()
        if pending:
            return jsonify({"message": "申请已提交，等待审核"}), 200
        req = ClassJoinRequest(
            id=str(uuid4()),
            class_id=classroom.id,
            student_user_id=student.id,
        )
        try:
            db.session.add(req)
            db.session.commit()
            return jsonify({"message": "申请已提交，等待审核"}), 200
        except Exception as exc:
            db.session.rollback()
            print(f"Database save failed: {exc}")
            return jsonify({"error": "申请提交失败"}), 500

    member = ClassMember(class_id=classroom.id, student_user_id=student.id)
    try:
        db.session.add(member)
        db.session.commit()
        return jsonify({"message": "加入成功"}), 200
    except Exception as exc:
        db.session.rollback()
        print(f"Database save failed: {exc}")
        return jsonify({"error": "加入失败"}), 500


@class_bp.route("/api/v1/classes/mine", methods=["GET"])
@active_required
def list_my_classes():
    claims = get_jwt()
    role = claims.get("role")
    if role and role != "user":
        return jsonify({"error": "只有学生可以查看班级"}), 403

    username = get_jwt_identity()
    student = User.query.filter_by(username=username).first()
    if not student:
        return jsonify({"error": "用户不存在"}), 401
    try:
        classes = (
            db.session.query(ClassRoom, User.username)
            .join(ClassMember, ClassMember.class_id == ClassRoom.id)
            .join(User, User.id == ClassRoom.teacher_user_id)
            .filter(ClassMember.student_user_id == student.id)
            .order_by(ClassRoom.created_at.desc())
            .all()
        )
        return jsonify([
            {
                "id": classroom.id,
                "name": classroom.name,
                "grade": classroom.grade,
                "subject": classroom.subject,
                "teacherUsername": teacher_username,
            }
            for classroom, teacher_username in classes
        ])
    except Exception as exc:
        print(f"Database query failed: {exc}")
        return jsonify({"error": "班级列表查询失败"}), 500


@class_bp.route("/api/v1/classes/leave/<class_id>", methods=["POST"])
@active_required
def leave_class(class_id):
    claims = get_jwt()
    role = claims.get("role")
    if role and role != "user":
        return jsonify({"error": "只有学生可以退出班级"}), 403

    username = get_jwt_identity()
    student = User.query.filter_by(username=username).first()
    if not student:
        return jsonify({"error": "用户不存在"}), 401
    try:
        member = ClassMember.query.filter_by(class_id=class_id, student_user_id=student.id).first()
        if not member:
            return jsonify({"error": "你不在该班级"}), 404
        db.session.delete(member)
        db.session.commit()
        return jsonify({"message": "已退出班级"}), 200
    except Exception as exc:
        db.session.rollback()
        print(f"Database delete failed: {exc}")
        return jsonify({"error": "退出班级失败"}), 500
