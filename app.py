from flask import Flask, render_template, request, send_file, jsonify
from pypdf import PdfReader, PdfWriter
from pdf2image import convert_from_bytes
import io
import base64

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

# PDFアップロード → 各ページのプレビュー画像を生成
@app.route("/upload", methods=["POST"])
def upload_pdf():
    file = request.files["file"]
    pdf_bytes = file.read()

    reader = PdfReader(io.BytesIO(pdf_bytes))
    images = convert_from_bytes(pdf_bytes, dpi=120)

    previews = []
    for i, img in enumerate(images):
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        img_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        previews.append({
            "page": i,
            "image": f"data:image/png;base64,{img_b64}"
        })

    return jsonify({
        "page_count": len(reader.pages),
        "previews": previews
    })

# チェックされたページだけでPDF生成
@app.route("/download", methods=["POST"])
def download_pdf():
    file = request.files["file"]
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
        mimetype="application/pdf",
        as_attachment=True,
        download_name="selected_pages.pdf"
    )

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
