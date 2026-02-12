const pdfInput = document.getElementById("pdfFile");
const hiddenFileInput = document.getElementById("hiddenFile");
const pagesDiv = document.getElementById("pages");
const warningDiv = document.getElementById("warning");
const loadingDiv = document.getElementById("loading");
const downloadBtn = document.getElementById("downloadBtn");
const downloadForm = document.getElementById("downloadForm");
const dropArea = document.getElementById("drop-area");

let loadingTimer = null;

// --------------------
// ローディング表示
// --------------------
function startLoading(message) {
    let dots = 0;
    loadingDiv.style.display = "block";

    loadingTimer = setInterval(() => {
        dots = (dots + 1) % 4;
        loadingDiv.textContent = message + "・".repeat(dots);
    }, 400);
}

function stopLoading() {
    clearInterval(loadingTimer);
    loadingDiv.style.display = "none";
}

// --------------------
// PDF処理
// --------------------
async function handlePDF(file) {
    warningDiv.textContent = "";
    pagesDiv.innerHTML = "";
    downloadBtn.disabled = true;

    startLoading("ページ表示中");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/preview", {
        method: "POST",
        body: formData
    });

    if (!res.ok) {
        stopLoading();
        warningDiv.textContent = "PDFの読み込みに失敗しました。";
        return;
    }

    const data = await res.json();
    stopLoading();

    if (data.error) {
        warningDiv.textContent = data.error;
        return;
    }

    if (data.pages.length <= 1) {
        warningDiv.textContent = "ページが1ページしかありません。";
        return;
    }

    data.pages.forEach((img, index) => {
        const div = document.createElement("div");
        div.className = "page";

        div.innerHTML = `
            <label>
                <input type="checkbox" name="pages" value="${index + 1}" checked>
                ページ ${index + 1}
            </label><br>
            <img src="data:image/png;base64,${img}">
        `;

        pagesDiv.appendChild(div);
    });

    hiddenFileInput.files = pdfInput.files;
    downloadBtn.disabled = false;
}

// --------------------
// ファイル選択
// --------------------
pdfInput.addEventListener("change", () => {
    if (pdfInput.files.length > 0) {
        handlePDF(pdfInput.files[0]);
    }
});

// --------------------
// ドラッグ＆ドロップ
// --------------------
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
        warningDiv.textContent = "PDFファイルを選択してください。";
    }
});

// --------------------
// ダウンロード中表示
// --------------------
downloadForm.addEventListener("submit", () => {
    startLoading("ダウンロード中");
    downloadBtn.disabled = true;
});
