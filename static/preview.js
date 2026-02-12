const dropArea = document.getElementById("drop-area");
const pdfFileInput = document.getElementById("pdfFile");
const hiddenFileInput = document.getElementById("hiddenFile");
const warning = document.getElementById("warning");
const downloadBtn = document.getElementById("downloadBtn");

dropArea.addEventListener("click", () => {
    pdfFileInput.click();
});

dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.classList.add("dragover");
});

dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("dragover");
});

dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dropArea.classList.remove("dragover");

    const file = e.dataTransfer.files[0];
    if (file) {
        handleFile(file);
    }
});

pdfFileInput.addEventListener("change", () => {
    if (pdfFileInput.files.length > 0) {
        handleFile(pdfFileInput.files[0]);
    }
});

function handleFile(file) {
    warning.textContent = "";

    if (file.type !== "application/pdf") {
        warning.textContent = "PDFファイルを選択してください。";
        return;
    }

    if (file.size > 50 * 1024 * 1024) {
        warning.textContent = "ファイルサイズは50MB以下にしてください。";
        return;
    }

    // ダウンロード用にセット
    const dt = new DataTransfer();
    dt.items.add(file);
    hiddenFileInput.files = dt.files;

    downloadBtn.disabled = false;

    // ※ ここで本来はページプレビュー取得（省略）
}
