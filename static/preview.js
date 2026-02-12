const dropArea = document.getElementById("drop-area");
const pdfInput = document.getElementById("pdfFile");
const hiddenFile = document.getElementById("hiddenFile");
const pagesDiv = document.getElementById("pages");
const warningDiv = document.getElementById("warning");
const loadingDiv = document.getElementById("loading");
const downloadBtn = document.getElementById("downloadBtn");

function showLoading(message) {
    loadingDiv.textContent = message;
}

function clearLoading() {
    loadingDiv.textContent = "";
}

function handleFile(file) {
    pagesDiv.innerHTML = "";
    warningDiv.textContent = "";
    downloadBtn.disabled = true;

    showLoading("ページ表示中・・・");

    const formData = new FormData();
    formData.append("file", file);

    // ダウンロード用に同じPDFを保持
    const dt = new DataTransfer();
    dt.items.add(file);
    hiddenFile.files = dt.files;

    fetch("/preview", {
        method: "POST",
        body: formData
    })
    .then(res => res.json().then(data => ({ ok: res.ok, data })))
    .then(res => {
        clearLoading();

        if (!res.ok) {
            warningDiv.textContent = res.data.error;
            return;
        }

        res.data.pages.forEach(p => {
            const div = document.createElement("div");
            div.className = "page";

            const img = document.createElement("img");
            img.src = `data:image/jpeg;base64,${p.image}`;
            img.alt = `ページ ${p.page}`;

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = "pages";
            checkbox.value = p.page;
            checkbox.checked = true;

            const label = document.createElement("label");
            label.appendChild(checkbox);
            label.appendChild(document.createElement("br"));
            label.appendChild(img);
            label.appendChild(document.createElement("br"));
            label.append(`ページ ${p.page}`);

            div.appendChild(label);
            pagesDiv.appendChild(div);
        });

        downloadBtn.disabled = false;
    })
    .catch(() => {
        clearLoading();
        warningDiv.textContent = "PDFの読み込みに失敗しました。";
    });
}

// ファイル選択
pdfInput.addEventListener("change", () => {
    if (pdfInput.files.length > 0) {
        handleFile(pdfInput.files[0]);
    }
});

// ドラッグ＆ドロップ
["dragenter", "dragover"].forEach(event => {
    dropArea.addEventListener(event, e => {
        e.preventDefault();
        dropArea.classList.add("dragover");
    });
});

["dragleave", "drop"].forEach(event => {
    dropArea.addEventListener(event, e => {
        e.preventDefault();
        dropArea.classList.remove("dragover");
    });
});

dropArea.addEventListener("drop", e => {
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
        handleFile(file);
    }
});
