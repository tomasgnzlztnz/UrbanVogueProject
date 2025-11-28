// /js/checkout.js

document.addEventListener("DOMContentLoaded", () => {
    const errorEl        = document.getElementById("checkoutError");
    const contentEl      = document.getElementById("checkoutContent");
    const successSection = document.getElementById("checkoutSuccess");

    const inputNombre    = document.getElementById("inputNombre");
    const inputEmail     = document.getElementById("inputEmail");
    const inputDireccion = document.getElementById("inputDireccion");
    const inputTelefono  = document.getElementById("inputTelefono");

    const inputCardNumber = document.getElementById("inputCardNumber");
    const inputCardExpiry = document.getElementById("inputCardExpiry");
    const inputCardCvv    = document.getElementById("inputCardCvv");

    const itemsListEl    = document.getElementById("checkoutItemsList");
    const totalEl        = document.getElementById("checkoutTotal");
    const emptyCartEl    = document.getElementById("checkoutCartEmpty");

    const checkoutForm   = document.getElementById("checkoutForm");
    const btnConfirm     = document.getElementById("btnConfirmPayment");

    const successOrderIdEl    = document.getElementById("successOrderId");
    const successOrderTotalEl = document.getElementById("successOrderTotal");

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

    // Cargar datos del usuario logueado
    async function loadUser() {
        try {
            const data = await fetchCurrentUser(); // viene de auth.js
            console.log("DEBUG checkout → user:", data);

            if (!data || !data.autenticado) {
                window.location.href = "/pages/login.html";
                return;
            }

            const u = data.usuario || {};

            if (inputNombre)    inputNombre.value    = u.nombre || "";
            if (inputEmail)     inputEmail.value     = u.email  || "";
            if (inputDireccion) inputDireccion.value = u.direccion || "";
            if (inputTelefono)  inputTelefono.value  = u.telefono  || "";

        } catch (err) {
            console.error("Error cargando usuario en checkout:", err);
            showError("Error al cargar tus datos. Inténtalo de nuevo más tarde.");
        }
    }

    // Cargar carrito para mostrar resumen
    async function loadCartSummary() {
        try {
            const res = await fetch("/api/cart", {
                method: "GET",
                credentials: "include"
            });

            if (res.status === 401) {
                // Sin sesión → login
                window.location.href = "/pages/login.html";
                return;
            }

            const data = await res.json();
            console.log("DEBUG checkout → cart:", data);

            const items = data.items || [];
            const total = Number(data.total || 0);

            if (items.length === 0) {
                if (emptyCartEl) emptyCartEl.classList.remove("d-none");
                if (itemsListEl) itemsListEl.innerHTML = "";
                if (totalEl) totalEl.textContent = "0,00 €";
                return;
            }

            if (emptyCartEl) emptyCartEl.classList.add("d-none");

            if (itemsListEl) {
                itemsListEl.innerHTML = "";
                items.forEach(item => {
                    const li = document.createElement("li");
                    li.className = "d-flex justify-content-between align-items-center mb-2";

                    const tallaTxt = item.talla ? ` (Talla ${item.talla})` : "";

                    li.innerHTML = `
                        <div>
                            <div class="fw-semibold small">
                                ${item.nombre}${tallaTxt}
                            </div>
                            <div class="text-muted small">
                                x${item.cantidad} · ${Number(item.precio).toFixed(2)} €
                            </div>
                        </div>
                        <div class="fw-semibold small">
                            ${Number(item.total_linea).toFixed(2)} €
                        </div>
                    `;

                    itemsListEl.appendChild(li);
                });
            }

            if (totalEl) {
                totalEl.textContent = `${total.toFixed(2)} €`;
            }

        } catch (err) {
            console.error("Error cargando resumen carrito en checkout:", err);
            showError("Error al cargar el resumen del pedido.");
        }
    }

    // Validar el formulario (datos personales + tarjeta)
    function validateForm() {
        clearError();
        const errors = [];

        const nombre    = inputNombre?.value.trim()    || "";
        const direccion = inputDireccion?.value.trim() || "";
        const telefono  = inputTelefono?.value.trim()  || "";

        const cardNumber = (inputCardNumber?.value || "").replace(/\s+/g, "");
        const cardExpiry = inputCardExpiry?.value.trim() || "";
        const cardCvv    = inputCardCvv?.value.trim()    || "";

        // Datos personales básicos
        if (!nombre) {
            errors.push("El nombre es obligatorio.");
        }

        if (!direccion || direccion.length < 5) {
            errors.push("La dirección es obligatoria y debe ser más detallada.");
        }

        if (!telefono || telefono.length < 6) {
            errors.push("El teléfono es obligatorio.");
        }

        // Número de tarjeta: 16 dígitos
        if (!/^\d{16}$/.test(cardNumber)) {
            errors.push("El número de tarjeta debe tener 16 dígitos.");
        }

        // Caducidad: MM/AA y no caducada
        const expiryMatch = /^(\d{2})\/(\d{2})$/.exec(cardExpiry);
        if (!expiryMatch) {
            errors.push("La fecha de caducidad debe tener formato MM/AA.");
        } else {
            const mm = parseInt(expiryMatch[1], 10);
            const yy = parseInt(expiryMatch[2], 10); // 00-99

            if (mm < 1 || mm > 12) {
                errors.push("El mes de caducidad debe estar entre 01 y 12.");
            } else {
                const now = new Date();
                const currentYear = now.getFullYear() % 100; // dos dígitos
                const currentMonth = now.getMonth() + 1;     // 1-12

                if (yy < currentYear || (yy === currentYear && mm < currentMonth)) {
                    errors.push("La tarjeta está caducada.");
                }
            }
        }

        // CVV: 3 dígitos
        if (!/^\d{3}$/.test(cardCvv)) {
            errors.push("El CVV debe tener 3 dígitos.");
        }

        if (errors.length > 0) {
            showError(errors.join(" "));
            return false;
        }

        return true;
    }

    // Actualizar perfil del usuario (opcional pero queda profesional)
    async function updateUserProfile() {
        const nombre    = inputNombre?.value.trim()    || "";
        const direccion = inputDireccion?.value.trim() || "";
        const telefono  = inputTelefono?.value.trim()  || "";

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

            const data = await res.json();
            console.log("updateUserProfile:", data);

            // Si falla, no bloqueamos el pago, solo mostramos aviso
            if (!data.success) {
                console.warn("No se pudo actualizar el perfil:", data);
            }
        } catch (err) {
            console.error("Error actualizando perfil:", err);
        }
    }

    // Procesar el pago → /api/cart/checkout
    async function processPayment() {
        clearError();

        try {
            // 1) Opcionalmente actualizamos datos del usuario
            await updateUserProfile();

            // 2) Creamos el pedido a partir del carrito
            const res = await fetch("/api/cart/checkout", {
                method: "POST",
                credentials: "include"
            });

            if (res.status === 401) {
                window.location.href = "/pages/login.html";
                return;
            }

            const data = await res.json();
            console.log("checkout:", data);

            if (!data.success) {
                showError(data.error || "No se pudo procesar el pedido.");
                return;
            }

            // 3) Mostrar pantalla de éxito
            const pedidoId = data.pedidoId;
            const total    = Number(data.total || 0);

            if (successOrderIdEl) {
                successOrderIdEl.textContent = pedidoId || "-";
            }
            if (successOrderTotalEl) {
                successOrderTotalEl.textContent = `${total.toFixed(2)} €`;
            }

            if (contentEl)      contentEl.classList.add("d-none");
            if (successSection) successSection.classList.remove("d-none");

            // 4) Redirigir a home tras 10 segundos
            setTimeout(() => {
                window.location.href = "/index.html";
            }, 10000);

        } catch (err) {
            console.error("Error en processPayment():", err);
            showError("Ha ocurrido un error al procesar el pago.");
        }
    }

    // Listener del formulario
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!validateForm()) {
                return;
            }

            // Desactivar botón mientras se procesa
            if (btnConfirm) {
                btnConfirm.disabled = true;
                btnConfirm.textContent = "Procesando pago...";
            }

            await processPayment();

            // Si hubo error, reactivamos el botón (si se ha mostrado éxito ya no importa)
            if (btnConfirm && !successSection.classList.contains("d-none")) {
                // en éxito no reactivamos
            } else if (btnConfirm) {
                btnConfirm.disabled = false;
                btnConfirm.textContent = "Confirmar pago";
            }
        });
    }

    // Inicialización
    (async () => {
        await loadUser();
        await loadCartSummary();
    })();
});
