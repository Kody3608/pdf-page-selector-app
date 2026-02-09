console.log("preview.js loaded");

const pdfInput = document.getElementById("pdfFile");
const pagesDiv = document.getElementById("pages");
const hiddenFile = document.getElementById("hiddenFile");
const warningDiv = document.getElementById("warning");
const downloadBtn = document.getElementById("downloadBtn");

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

// 初期状態は必ず無効
downloadBtn.disabled = true;

pdfInput.addEventListener("change", async () => {
    const file = pdfInput.files[0];

    // 初期化
    pagesDiv.innerHTML = "";
    warningDiv.textContent = "";
    downloadBtn.disabled = true;

    if (!file) return;

    /* ===== 容量チェック ===== */
    if (file.size > MAX_SIZE) {
        warningDiv.textContent =
            "PDFファイルのサイズが50MBを超えています。50MB以下のファイルを選択してください。";
        pdfInput.value = "";
        return;
    }

    // hidden file にセット
    const dt = new DataTransfer();
    dt.items.add(file);
    hiddenFile.files = dt.files;

    const formData = new FormData();
    formData.append("file", file);

    let response;
    try {
        response = await fetch("/upload", {
            method: "POST",
            body: formData
        });
    } catch {
        warningDiv.textContent = "サーバーに接続できません。";
        return;
    }

    if (!response.ok) {
        warningDiv.textContent = "PDFの読み込みに失敗しました。";
        return;
    }

    const data = await response.json();

    /* ===== ページ数チェック ===== */
    if (data.page_count <= 1) {
        warningDiv.textContent = "このPDFはページが1ページしかありません。";
        return;
    }

    // ページ表示
    data.previews.forEach(p => {
        const div = document.createElement("div");
        div.className = "page";
        div.innerHTML = `
            <label>
                <input type="checkbox" name="pages" value="${p.page}" checked>
                <br>
                <img src="${p.image}">
                <div>ページ ${p.page + 1}</div>
            </label>
        `;
        pagesDiv.appendChild(div);
    });

    // ★ ここまで来たら「正常読み込み」なので有効化
    downloadBtn.disabled = false;
});
