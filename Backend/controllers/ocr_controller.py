from flask import Blueprint, jsonify, request

from services.auth_service import active_required
from services.ocr_service import (
    ALLOWED_IMAGE_EXTENSIONS,
    ALLOWED_TEXT_EXTENSIONS,
    allowed_file,
    recognize_handwriting_text,
)


ocr_bp = Blueprint("ocr", __name__)


@ocr_bp.route("/api/v1/ocr", methods=["POST"])
@active_required
def ocr_handler():
    file = request.files.get("file")
    if file is None:
        return jsonify({"error": "未找到上传文件"}), 400

    filename = file.filename

    if allowed_file(filename, ALLOWED_TEXT_EXTENSIONS):
        try:
            text_content = file.read().decode("utf-8")
            return jsonify({
                "status": "success",
                "content": text_content
            })
        except UnicodeDecodeError:
            return jsonify({"error": "Could not decode text file (try UTF-8 encoding)"}), 422
        except Exception as exc:
            return jsonify({"error": f"Failed to read text file: {exc}"}), 500

    if allowed_file(filename, ALLOWED_IMAGE_EXTENSIONS):
        image_content = recognize_handwriting_text(file)
        return jsonify({
            "status": "success",
            "content": image_content,
        })

    unsupported_extensions = ALLOWED_TEXT_EXTENSIONS.union(ALLOWED_IMAGE_EXTENSIONS)
    return jsonify({
        "error": (
            "Unsupported file format. Please upload .txt or image files "
            f"({', '.join(unsupported_extensions)})."
        )
    }), 415
