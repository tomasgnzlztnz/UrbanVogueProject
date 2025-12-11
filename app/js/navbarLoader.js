document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("navbarContainer");

    if (container) {
        fetch("/components/navbar.html")
            .then(res => res.text())
            .then(html => {
                container.innerHTML = html;

                
                const script = document.createElement("script");
                script.src = "/js/navbar.js";
                document.body.appendChild(script);
            });
    }
});
