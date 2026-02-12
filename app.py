from flask import Flask, render_template, request, send_file, jsonify
from PyPDF2 import PdfReader, PdfWriter
import io

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/preview", methods=["POST"])
def preview():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "ファイルがありません"}), 400

    reader = PdfReader(file)
    page_count = len(reader.pages)

    if page_count <= 1:
        return jsonify({"error": "ページが1ページしかありません"}), 400

    return jsonify({"pages": page_count})

@app.route("/download", methods=["POST"])
def download():
    file = request.files.get("file")
    keep_pages = request.form.getlist("pages")

    reader = PdfReader(file)
    writer = PdfWriter()

    for i in keep_pages:
        writer.add_page(reader.pages[int(i)])

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
