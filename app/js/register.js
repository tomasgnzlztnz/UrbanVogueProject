// app/js/register.js

document.addEventListener("DOMContentLoaded", () => {
    const form            = document.getElementById("registerForm");
    const inputNombre     = document.getElementById("name");
    const inputEmail      = document.getElementById("email");
    const inputPassword   = document.getElementById("password");
    const inputPassword2  = document.getElementById("confirmPassword");

    const errorEl   = document.getElementById("registerError");
    const successEl = document.getElementById("registerSuccess");

    function showError(msg) {
        if (!errorEl) return;
        errorEl.textContent = msg;
        errorEl.classList.remove("d-none");
        if (successEl) {
            successEl.classList.add("d-none");
            successEl.textContent = "";
        }
    }

    function showSuccess(msg) {
        if (!successEl) return;
        successEl.textContent = msg;
        successEl.classList.remove("d-none");
        if (errorEl) {
            errorEl.classList.add("d-none");
            errorEl.textContent = "";
        }
    }

    if (!form) {
        console.error("No se encontró el formulario de registro");
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombre    = inputNombre ? inputNombre.value.trim() : "";
        const email     = inputEmail ? inputEmail.value.trim() : "";
        const password  = inputPassword ? inputPassword.value : "";
        const password2 = inputPassword2 ? inputPassword2.value : "";

        // Validaciones simples en el front
        if (!nombre || !email || !password || !password2) {
            showError("Por favor, rellena todos los campos.");
            return;
        }

        if (password.length < 6) {
            showError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        if (password !== password2) {
            showError("Las contraseñas no coinciden.");
            return;
        }

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nombre,
                    email,
                    password
                    // Si más adelante añades dirección/teléfono en el form, los envías también aquí
                })
            });

            const data = await res.json();
            console.log("DEBUG register:", data);

            if (!res.ok || !data.success) {
                showError(data.message || "No se ha podido crear la cuenta.");
                return;
            }

            showSuccess("Cuenta creada correctamente. Redirigiendo al login...");

            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                window.location.href = "/pages/login.html";
            }, 5000);

        } catch (err) {
            console.error("Error en register.js:", err);
            showError("Ha ocurrido un error al registrar la cuenta.");
        }
    });
});
