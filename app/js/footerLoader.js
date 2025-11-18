document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("footerContainer");

    if (container) {
        fetch("/components/footer.html")
            .then(res => res.text())
            .then(html => container.innerHTML = html);
    }
});
