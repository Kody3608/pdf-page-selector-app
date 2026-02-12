from flask import Flask, render_template, request, jsonify, send_file
from pdf2image import convert_from_bytes
from io import BytesIO
import base64

app = Flask(__name__)

MAX_PREVIEW_PAGES = 10  # 最大プレビュー枚数


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/preview", methods=["POST"])
def preview():
    if "file" not in request.files:
        return jsonify({"error": "ファイルがありません"}), 400

    file = request.files["file"]
    pdf_bytes = file.read()

    try:
        images = convert_from_bytes(
            pdf_bytes,
            dpi=72,              # ★ 低解像度（最重要）
            fmt="jpeg",
            thread_count=2
        )
    except Exception:
        return jsonify({"error": "PDFの読み込みに失敗しました。"}), 500

    if len(images) <= 1:
        return jsonify({"error": "ページが1ページしかありません。"}), 400

    images = images[:MAX_PREVIEW_PAGES]

    pages = []
    for i, img in enumerate(images):
        buf = BytesIO()
        img.save(buf, format="JPEG", quality=70)
        encoded = base64.b64encode(buf.getvalue()).decode("utf-8")

        pages.append({
            "page": i + 1,
            "image": encoded
        })

    return jsonify({"pages": pages})


@app.route("/download", methods=["POST"])
def download():
    file = request.files.get("file")
    selected_pages = request.form.getlist("pages")

    if not file or not selected_pages:
        return "不正なリクエスト", 400

    pdf_bytes = file.read()
    images = convert_from_bytes(pdf_bytes, dpi=150)

    selected_images = [images[int(p) - 1] for p in selected_pages]

    output = BytesIO()
    selected_images[0].save(
        output,
        format="PDF",
        save_all=True,
        append_images=selected_images[1:]
    )
    output.seek(0)

    return send_file(
        output,
        as_attachment=True,
        download_name="selected_pages.pdf",
        mimetype="application/pdf"
    )


if __name__ == "__main__":
    app.run(debug=True)
