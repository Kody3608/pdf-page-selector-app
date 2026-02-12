const dropArea = document.getElementById("drop-area");
const pdfInput = document.getElementById("pdfFile");
const hiddenFile = document.getElementById("hiddenFile");
const pagesDiv = document.getElementById("pages");
const warningDiv = document.getElementById("warning");
const downloadBtn = document.getElementById("downloadBtn");

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

// =======================
// 共通：PDF読み込み処理
// =======================
function handlePdf(file) {
    pagesDiv.innerHTML = "";
    warningDiv.textContent = "";
    downloadBtn.disabled = true;

    if (!file) return;

    // サイズ制限
    if (file.size > MAX_SIZE) {
        warningDiv.textContent = "ファイルサイズは50MB以下にしてください。";
        return;
    }

    // hidden file にセット（ダウンロード用）
    const dt = new DataTransfer();
    dt.items.add(file);
    hiddenFile.files = dt.files;

    const formData = new FormData();
    formData.append("file", file);

    fetch("/preview", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.page_count <= 1) {
            warningDiv.textContent = "ページが1ページしかありません。";
            return;
        }

        data.pages.forEach((imgBase64, index) => {
            const pageDiv = document.createElement("div");
            pageDiv.className = "page";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = "keep_pages";
            checkbox.value = index;
            checkbox.checked = true;

            checkbox.addEventListener("change", () => {
                const checked = document.querySelectorAll(
                    'input[name="keep_pages"]:checked'
                );
                downloadBtn.disabled = checked.length === 0;
            });

            const img = document.createElement("img");
            img.src = "data:image/png;base64," + imgBase64;

            const label = document.createElement("label");
            label.appendChild(checkbox);
            label.append(` ページ ${index + 1}`);

            pageDiv.appendChild(img);
            pageDiv.appendChild(label);
            pagesDiv.appendChild(pageDiv);
        });

        downloadBtn.disabled = false;
    })
    .catch(() => {
        warningDiv.textContent = "PDFの読み込みに失敗しました。";
    });
}

// =======================
// クリック選択
// =======================
dropArea.addEventListener("click", () => {
    pdfInput.click();
});

pdfInput.addEventListener("change", () => {
    const file = pdfInput.files[0];
    handlePdf(file);
});

// =======================
// ドラッグ＆ドロップ
// =======================
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
    if (!file || file.type !== "application/pdf") {
        warningDiv.textContent = "PDFファイルを選択してください。";
        return;
    }

    handlePdf(file);
});
