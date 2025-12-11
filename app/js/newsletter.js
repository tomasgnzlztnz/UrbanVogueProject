function initNewsletterForm() {
  const form = document.getElementById("newsletterForm");
  if (!form) return;

  const input = document.getElementById("newsletterEmail");
  const messageEl = document.getElementById("newsletterMessage");

  function showMessage(text, type = "success") {
    if (!messageEl) return;
    messageEl.textContent = text;

    
    if (type === "success") {
      messageEl.classList.remove("text-danger");
      messageEl.classList.add("text-success");
    } else {
      messageEl.classList.remove("text-success");
      messageEl.classList.add("text-danger");
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!input) return;

    const email = input.value.trim();

    if (!email) {
      showMessage("Por favor, introduce un correo.", "error");
      return;
    }

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json().catch(() => ({}));
      console.log("DEBUG newsletter:", data);

      if (!res.ok || !data.success) {
        showMessage(data.message || "No se pudo procesar la suscripción.", "error");
        return;
      }

      showMessage(data.message || "Te has suscrito correctamente.");
      input.value = "";

    } catch (err) {
      console.error("Error en newsletter:", err);
      showMessage("Ha ocurrido un error al suscribirte.", "error");
    }
  });
}


document.addEventListener("DOMContentLoaded", () => {
  initNewsletterForm();
});
