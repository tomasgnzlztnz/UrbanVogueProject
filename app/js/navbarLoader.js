// navbarLoader.js
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("navbarContainer");

    if (container) {
        fetch("/components/navbar.html")
            .then(res => res.text())
            .then(html => {
                container.innerHTML = html;

                // Cuando ya está cargada, activamos la lógica de roles
                const script = document.createElement("script");
                script.src = "/js/navbar.js";
                document.body.appendChild(script);
            });
    }
});
