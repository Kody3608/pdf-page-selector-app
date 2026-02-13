from flask import Flask, render_template, request, jsonify, send_file
from pdf2image import convert_from_bytes
from PyPDF2 import PdfReader, PdfWriter
import base64
import io
import os

app = Flask(__name__)

POPPLER_PATH = "/usr/bin"  # Renderではここに入る

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/preview", methods=["POST"])
def preview():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "ファイルがありません"}), 400

    pdf_bytes = file.read()

    reader = PdfReader(io.BytesIO(pdf_bytes))
    if len(reader.pages) <= 1:
        return jsonify({"error": "ページが1ページしかありません"}), 400

    try:
        images = convert_from_bytes(
            pdf_bytes,
            dpi=80,
            poppler_path=POPPLER_PATH
        )
    except Exception as e:
        return jsonify({"error": f"PDF変換失敗: {e}"}), 500

    pages = []
    for i, img in enumerate(images):
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        img_base64 = base64.b64encode(buf.getvalue()).decode()
        pages.append({
            "index": i,
            "image": img_base64
        })

    return jsonify({"pages": pages})

@app.route("/download", methods=["POST"])
def download():
    file = request.files.get("file")
    pages = request.form.getlist("pages")

    reader = PdfReader(file)
    writer = PdfWriter()

    for p in pages:
        writer.add_page(reader.pages[int(p)])

    output = io.BytesIO()
    writer.write(output)
    output.seek(0)

    return send_file(
        output,
        as_attachment=True,
        download_name="selected_pages.pdf",
        mimetype="application/pdf"
    )

if __name__ == "__main__":
    app.run(debug=True)
