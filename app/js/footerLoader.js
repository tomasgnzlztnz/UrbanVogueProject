// /js/footerLoader.js

document.addEventListener("DOMContentLoaded", async () => {
  const footerContainer = document.getElementById("footerContainer");
  if (!footerContainer) return;

  try {
    const res = await fetch("/components/footer.html");
    const html = await res.text();
    footerContainer.innerHTML = html;

    // 👇 cuando el footer ya está en el DOM, inicializamos el formulario
    if (typeof initNewsletterForm === "function") {
      initNewsletterForm();
    }
  } catch (err) {
    console.error("Error cargando footer:", err);
  }
});
