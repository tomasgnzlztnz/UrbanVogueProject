// app/js/cart.js

document.addEventListener("DOMContentLoaded", async () => {
    const errorEl   = document.getElementById("cartError");
    const emptyEl   = document.getElementById("cartEmpty");
    const contentEl = document.getElementById("cartContent");
    const tbodyEl   = document.getElementById("cartItemsBody");
    const totalEl   = document.getElementById("cartTotal");

    // Función helper para mostrar errores
    function showError(msg) {
        if (!errorEl) return;
        errorEl.textContent = msg;
        errorEl.classList.remove("d-none");
    }

    try {
        // Llamamos a la API del carrito
        const res = await fetch("/api/cart", {
            method: "GET",
            credentials: "include"
        });

        if (res.status === 401) {
            // No logueado → lo mandamos al login
            window.location.href = "/pages/login.html";
            return;
        }

        const data = await res.json();
        console.log("DEBUG carrito:", data);

        const items = data.items || [];
        const total = data.total || 0;

        // Si no hay items:
        if (items.length === 0) {
            if (emptyEl)   emptyEl.classList.remove("d-none");
            if (contentEl) contentEl.classList.add("d-none");
            return;
        }

        // Hay productos → ocultamos mensaje "vacío" y mostramos tabla
        if (emptyEl)   emptyEl.classList.add("d-none");
        if (contentEl) contentEl.classList.remove("d-none");

        // Limpiamos tabla
        if (tbodyEl) tbodyEl.innerHTML = "";

        // Rellenamos filas
        items.forEach(item => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${item.nombre}</td>
                <td>${Number(item.precio).toFixed(2)} €</td>
                <td>${item.cantidad}</td>
                <td>${Number(item.total_linea).toFixed(2)} €</td>
                <td>
                    <!-- Más adelante aquí pondremos un botón para eliminar -->
                </td>
            `;

            tbodyEl.appendChild(tr);
        });

        // Total
        if (totalEl) {
            totalEl.textContent = `${Number(total).toFixed(2)} €`;
        }

    } catch (err) {
        console.error("Error cargando carrito:", err);
        showError("Ha ocurrido un error al cargar tu carrito.");
    }
});
