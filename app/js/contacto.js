document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const alertBox = document.getElementById("contactAlert");
  const submitBtn = document.getElementById("contactSubmitBtn");

  function showAlert(message, type = "success") {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.classList.remove("d-none");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alertBox.classList.add("d-none");

    const nombre = document.getElementById("contactNombre").value.trim();
    const email = document.getElementById("contactEmail").value.trim();
    const asunto = document.getElementById("contactAsunto").value.trim();
    const mensaje = document.getElementById("contactMensaje").value.trim();

    if (!nombre || !email || !asunto || !mensaje) {
      showAlert("Por favor, rellena todos los campos obligatorios.", "warning");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nombre, email, asunto, mensaje })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || "No se pudo enviar el mensaje.");
      }

      showAlert("Tu mensaje se ha enviado correctamente. Te responderemos lo antes posible.", "success");
      form.reset();
    } catch (err) {
      console.error("Error enviando formulario de contacto:", err);
      showAlert("Ha ocurrido un error al enviar el mensaje. Inténtalo de nuevo más tarde.", "danger");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "ENVIAR";
    }
  });
});
