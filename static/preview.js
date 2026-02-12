const pdfInput = document.getElementById("pdfFile");
const hiddenFileInput = document.getElementById("hiddenFile");
const pagesDiv = document.getElementById("pages");
const warningDiv = document.getElementById("warning");
const loadingDiv = document.getElementById("loading");
const downloadBtn = document.getElementById("downloadBtn");
const dropArea = document.getElementById("drop-area");

let loadingTimer = null;

/* ローディング表示 */
function startLoading(text) {
    let dots = 0;
    loadingDiv.style.display = "block";

    loadingTimer = setInterval(() => {
        dots = (dots + 1) % 4;
        loadingDiv.textContent = text + "・".repeat(dots);
    }, 400);
}

function stopLoading() {
    clearInterval(loadingTimer);
    loadingDiv.style.display = "none";
}

/* PDF処理 */
async function handlePDF(file) {
    pagesDiv.innerHTML = "";
    warningDiv.textContent = "";
    downloadBtn.disabled = true;

    startLoading("ページ表示中");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/preview", {
        method: "POST",
        body: formData
    });

    const data = await res.json();
    stopLoading();

    if (data.error) {
        warningDiv.textContent = data.error;
        return;
    }

    data.pages.forEach((b64, index) => {
        const div = document.createElement("div");
        div.className = "page";

        const img = document.createElement("img");
        img.src = "data:image/png;base64," + b64;

        div.appendChild(img);

        const label = document.createElement("label");
        label.innerHTML = `
            <input type="checkbox" name="pages" value="${index + 1}" checked>
            ページ ${index + 1}
        `;

        div.appendChild(label);
        pagesDiv.appendChild(div);
    });

    hiddenFileInput.files = pdfInput.files;
    downloadBtn.disabled = false;
}

/* ファイル選択 */
pdfInput.addEventListener("change", () => {
    if (pdfInput.files.length > 0) {
        handlePDF(pdfInput.files[0]);
    }
});

/* ドラッグ＆ドロップ */
dropArea.addEventListener("dragover", e => {
    e.preventDefault();
    dropArea.classList.add("dragover");
});

dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("dragover");
});

dropArea.addEventListener("drop", e => {
    e.preventDefault();
    dropArea.classList.remove("dragover");

    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
        handlePDF(file);
    } else {
        warningDiv.textContent = "PDFファイルを選択してください";
    }
});
