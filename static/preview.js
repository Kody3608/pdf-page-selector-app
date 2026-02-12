const pdfFileInput = document.getElementById("pdfFile");
const hiddenFileInput = document.getElementById("hiddenFile");
const dropZone = document.getElementById("drop-zone");
const warning = document.getElementById("warning");
const pagesDiv = document.getElementById("pages");
const downloadBtn = document.getElementById("downloadBtn");

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

// inputクリック
dropZone.addEventListener("click", () => {
    pdfFileInput.click();
});

// ファイル選択 or ドロップ共通処理
function handleFile(file) {
    warning.textContent = "";
    pagesDiv.innerHTML = "";
    downloadBtn.disabled = true;

    if (!file || file.type !== "application/pdf") {
        warning.textContent = "PDFファイルを選択してください。";
        return;
    }

    if (file.size > MAX_SIZE) {
        warning.textContent = "ファイルサイズは50MB以下にしてください。";
        return;
    }

    // hidden input にもセット（送信用）
    const dt = new DataTransfer();
    dt.items.add(file);
    hiddenFileInput.files = dt.files;

    // ページプレビュー取得
    const formData = new FormData();
    formData.append("file", file);

    fetch("/preview", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.pages.length <= 1) {
            warning.textContent = "ページが1ページしかありません。";
            return;
        }

        data.pages.forEach((img, index) => {
            const div = document.createElement("div");
            div.className = "page";

            div.innerHTML = `
                <img src="data:image/png;base64,${img}">
                <div>
                    <label>
                        <input type="checkbox" name="pages" value="${index}" checked>
                        ページ ${index + 1}
                    </label>
                </div>
            `;
            pagesDiv.appendChild(div);
        });

        downloadBtn.disabled = false;
    });
}

// input[type=file]
pdfFileInput.addEventListener("change", () => {
    handleFile(pdfFileInput.files[0]);
});

// ドラッグ処理
dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("dragover");

    const file = e.dataTransfer.files[0];
    handleFile(file);
});
