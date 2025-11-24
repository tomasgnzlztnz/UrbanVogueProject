// app/js/profile.js

document.addEventListener("DOMContentLoaded", async () => {
    const errorEl = document.getElementById("profileError");
    const successEl = document.getElementById("profileSuccess");

    const inputNombre = document.getElementById("profileNombre");
    const pEmail = document.getElementById("profileEmail");
    const pRol = document.getElementById("profileRole");
    const inputDireccion = document.getElementById("profileDireccion");
    const inputTelefono = document.getElementById("profileTelefono");
    const pFecha = document.getElementById("profileFecha");
    const form = document.getElementById("profileForm");

    function showError(msg) {
        if (!errorEl) return;
        errorEl.textContent = msg;
        errorEl.classList.remove("d-none");
    }

    function clearError() {
        if (!errorEl) return;
        errorEl.textContent = "";
        errorEl.classList.add("d-none");
    }

    function showSuccess(msg) {
        if (!successEl) return;
        successEl.textContent = msg;
        successEl.classList.remove("d-none");

        setTimeout(() => {
            successEl.classList.add("d-none");
            successEl.textContent = "";
        }, 3000);
    }

    let originalUser = null; // <- añadimos esto

    // 1. Cargar datos del usuario logueado
    try {
        const data = await fetchCurrentUser(); // función de auth.js

        console.log("DEBUG profile → usuario:", data);

        if (!data.autenticado || !data.usuario) {
            window.location.href = "/pages/login.html";
            return;
        }

        const user = data.usuario;

        // Guardamos copia original para comparar luego
        originalUser = {
            nombre: user.nombre || "",
            direccion: user.direccion || "",
            telefono: user.telefono || ""
        };

        if (inputNombre) inputNombre.value = originalUser.nombre;
        if (pEmail) pEmail.textContent = user.email || "";
        if (pRol) pRol.textContent = user.rol || "";
        if (inputDireccion) inputDireccion.value = originalUser.direccion;
        if (inputTelefono) inputTelefono.value = originalUser.telefono;
        if (pFecha && user.fecha_registro) {
            let raw = user.fecha_registro;
            if (typeof raw === "string") raw = raw.replace(" ", "T");
            const fecha = new Date(raw);
            if (!isNaN(fecha.getTime())) {
                pFecha.textContent = fecha.toLocaleString("es-ES");
            }
        }

    } catch (err) {
        console.error("Error cargando perfil:", err);
        showError("No se han podido cargar los datos de tu perfil.");
        return;
    }

    // 2. Guardar cambios al enviar el formulario
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            clearError();

            const nombre = inputNombre ? inputNombre.value.trim() : "";
            const direccion = inputDireccion ? inputDireccion.value.trim() : "";
            const telefono = inputTelefono ? inputTelefono.value.trim() : "";

            // Validación: nombre obligatorio
            if (!nombre) {
                showError("El nombre no puede estar vacío.");
                return;
            }

            // Validación: si no hemos cargado originalUser por lo que sea
            if (!originalUser) {
                showError("No se han podido validar los cambios del perfil.");
                return;
            }

            // Comprobar si realmente ha cambiado algo
            const hasChanges =
                nombre !== originalUser.nombre ||
                direccion !== originalUser.direccion ||
                telefono !== originalUser.telefono;

            if (!hasChanges) {
                showError("No has modificado ningún dato.");
                return;
            }

            try {
                const res = await fetch("/api/user/me", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        nombre,
                        direccion,
                        telefono
                    })
                });

                if (res.status === 401) {
                    window.location.href = "/pages/login.html";
                    return;
                }

                const data = await res.json();
                console.log("DEBUG update profile:", data);

                if (!data.success) {
                    showError(data.message || "No se pudieron guardar los cambios.");
                    return;
                }

                // Actualizamos también la copia local para próximas veces
                originalUser = { nombre, direccion, telefono };

                showSuccess("Perfil actualizado correctamente.");

            } catch (err) {
                console.error("Error al actualizar perfil:", err);
                showError("Ha ocurrido un error al actualizar tu perfil.");
            }
        });
    }
});
