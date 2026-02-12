from flask import Flask, render_template, request, jsonify, send_file
from pdf2image import convert_from_bytes
from io import BytesIO
import base64
from PyPDF2 import PdfReader, PdfWriter

app = Flask(__name__)

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/preview", methods=["POST"])
def preview():
    file = request.files.get("file")
    if not file:
        return jsonify(error="ファイルがありません")

    data = file.read()

    if len(data) > MAX_FILE_SIZE:
        return jsonify(error="ファイルサイズが50MBを超えています")

    try:
        # ★ 低解像度（高速）
        images = convert_from_bytes(
            data,
            dpi=60,
            fmt="png"
        )
    except Exception as e:
        return jsonify(error="PDFの読み込みに失敗しました")

    if len(images) <= 1:
        return jsonify(error="ページが1ページしかありません")

    pages_base64 = []

    for img in images:
        buf = BytesIO()
        img.save(buf, format="PNG")
        encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
        pages_base64.append(encoded)

    return jsonify(pages=pages_base64)


@app.route("/download", methods=["POST"])
def download():
    file = request.files.get("file")
    pages = request.form.getlist("pages")

    if not file or not pages:
        return "エラー", 400

    reader = PdfReader(file)
    writer = PdfWriter()

    for p in pages:
        writer.add_page(reader.pages[int(p) - 1])

    out = BytesIO()
    writer.write(out)
    out.seek(0)

    return send_file(
        out,
        as_attachment=True,
        download_name="selected_pages.pdf",
        mimetype="application/pdf"
    )


if __name__ == "__main__":
    app.run(debug=True)
