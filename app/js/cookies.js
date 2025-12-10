document.addEventListener("DOMContentLoaded", () => {

    const overlay = document.getElementById("cookieOverlay");
    const btnAccept = document.getElementById("btnCookiesAccept");
    const btnReject = document.getElementById("btnCookiesReject");

    if (!overlay || !btnAccept || !btnReject) return;

    // Leer elección anterior
    const stored = localStorage.getItem("uv_cookies_choice");

    if (!stored) {
        overlay.classList.remove("d-none");
    }

    // Aceptar
    btnAccept.addEventListener("click", () => {
        localStorage.setItem("uv_cookies_choice", "accepted");
        overlay.classList.add("d-none");
    });

    // Rechazar
    btnReject.addEventListener("click", () => {
        localStorage.setItem("uv_cookies_choice", "rejected");
        overlay.classList.add("d-none");
    });

    console.log("Delete cookies cache: localStorage.removeItem('uv_cookies_choice');");

});
