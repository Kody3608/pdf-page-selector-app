const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("fileInput");
const hiddenFile = document.getElementById("hiddenFile");
const pagesDiv = document.getElementById("pages");
const statusDiv = document.getElementById("status");

function showLoading(text) {
    let dots = 0;
    statusDiv.style.color = "blue";
    const timer = setInterval(() => {
        dots = (dots + 1) % 4;
        statusDiv.textContent = text + "・".repeat(dots);
    }, 500);
    return timer;
}

function handleFile(file) {
    pagesDiv.innerHTML = "";
    const timer = showLoading("ページ表示中");

    const formData = new FormData();
    formData.append("file", file);

    hiddenFile.files = fileInput.files;

    fetch("/preview", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        clearInterval(timer);
        statusDiv.textContent = "";

        if (data.error) {
            alert(data.error);
            return;
        }

        data.pages.forEach(p => {
            const div = document.createElement("div");
            div.className = "page";
            div.innerHTML = `
                <label>
                    <input type="checkbox" name="pages" value="${p.index}" checked>
                    <br>
                    <img src="data:image/png;base64,${p.image}">
                    <br>
                    ページ ${p.index + 1}
                </label>
            `;
            pagesDiv.appendChild(div);
        });
    })
    .catch(err => {
        clearInterval(timer);
        alert("PDFの読み込みに失敗しました");
        console.error(err);
    });
}

fileInput.addEventListener("change", e => {
    handleFile(e.target.files[0]);
});

dropZone.addEventListener("dragover", e => e.preventDefault());

dropZone.addEventListener("drop", e => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
});
