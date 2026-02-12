from flask import Flask, render_template, request, send_file, jsonify
from pypdf import PdfReader, PdfWriter
from pdf2image import convert_from_bytes
import io
import base64

app = Flask(__name__)

# =========================
# トップページ
# =========================
@app.route("/")
def index():
    return render_template("index.html")


# =========================
# PDFを読み込み → 各ページを画像にして返す
# =========================
@app.route("/preview", methods=["POST"])
def preview_pdf():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "ファイルがありません"}), 400

    pdf_bytes = file.read()

    # PDF → 画像（1ページずつ）
    images = convert_from_bytes(pdf_bytes, dpi=120)

    image_list = []
    for img in images:
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
        image_list.append(encoded)

    return jsonify({
        "pages": image_list,
        "page_count": len(image_list)
    })


# =========================
# 選択されたページだけでPDFを作成
# =========================
@app.route("/download", methods=["POST"])
def download_pdf():
    file = request.files.get("file")
    keep_pages = request.form.getlist("keep_pages")

    if not file or not keep_pages:
        return "不正なリクエスト", 400

    reader = PdfReader(file)
    writer = PdfWriter()

    for i in map(int, keep_pages):
        writer.add_page(reader.pages[i])

    output = io.BytesIO()
    writer.write(output)
    output.seek(0)

    return send_file(
        output,
        as_attachment=True,
        download_name="selected_pages.pdf",
        mimetype="application/pdf"
    )


# =========================
# 起動
# =========================
if __name__ == "__main__":
    app.run(debug=True)
