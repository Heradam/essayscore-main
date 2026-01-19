import os

from aip import AipOcr


ALLOWED_TEXT_EXTENSIONS = {"txt"}
ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "bmp"}


def allowed_file(filename, extensions):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in extensions


def classify_left_baselines_by_index(left_coords, tolerance):
    if not left_coords:
        return []
    clusters = [[0], []]
    current_cluster = 0
    min_lefts = [left_coords[0], 9999999999]
    for i in range(1, len(left_coords)):
        current_coord = left_coords[i]
        baseline_coord = left_coords[i - 1]
        if abs(current_coord - baseline_coord) <= tolerance:
            clusters[current_cluster].append(i)
            min_lefts[current_cluster] = min(min_lefts[current_cluster], left_coords[i])
        else:
            current_cluster = 1 - current_cluster
            clusters[current_cluster].append(i)
            min_lefts[current_cluster] = min(min_lefts[current_cluster], left_coords[i])
    if min_lefts[0] > min_lefts[1]:
        return clusters[0]
    return clusters[1]


def recognize_handwriting_text(file):
    app_id = "121329277"
    api_key = os.getenv("OCR_API_KEY")
    secret_key = os.getenv("OCR_SECRET_KEY")
    client = AipOcr(app_id, api_key, secret_key)

    image = file.read()
    options = {"detect_direction": "true"}
    try:
        res_image = client.handwriting(image, options)
    except Exception as exc:
        print(f"Baidu OCR API call failed: {exc}")
        return f"OCR API 调用失败: {exc}"

    if "error_code" in res_image:
        error_msg = res_image.get("error_msg", "未知错误")
        error_code = res_image["error_code"]
        print(f"Baidu OCR API Error {error_code}: {error_msg}")
        return f"OCR 识别失败: {error_msg} (代码: {error_code})"

    words_results = res_image.get("words_result", [])
    if not words_results:
        return ""

    structured_lines = []
    all_heights = []
    all_lefts = []
    for item in words_results:
        if "location" in item and "words" in item:
            left = item["location"]["left"]
            height = item["location"]["height"]
            top = item["location"]["top"]
            structured_lines.append({
                "words": item["words"],
                "top": top,
                "left": left,
                "height": height
            })
            all_heights.append(height)
            all_lefts.append(left)
    h_avg = sum(all_heights) / len(all_heights)
    indent_idx = classify_left_baselines_by_index(all_lefts, 1.5 * h_avg)
    indent_idx_set = set(indent_idx)
    is_indentation_present = len(indent_idx) > 0

    reconstructed_essay = []
    for idx, current_line in enumerate(structured_lines):
        words = current_line["words"]
        prefix = ""
        if is_indentation_present and idx in indent_idx_set:
            prefix = "\n\u3000\u3000"
        reconstructed_essay.append(prefix + words)
    return "".join(reconstructed_essay)
