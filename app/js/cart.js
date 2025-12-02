// app/js/cart.js

document.addEventListener("DOMContentLoaded", () => {
    const errorEl = document.getElementById("cartError");
    const emptyEl = document.getElementById("cartEmpty");
    const contentEl = document.getElementById("cartContent");
    const tbodyEl = document.getElementById("cartItemsBody");
    const totalEl = document.getElementById("cartTotal");
    const btnClear = document.getElementById("btnClearCart");
    const btnPay = document.getElementById("btnCheckout");

    function showError(msg) {
        if (!errorEl) return;
        errorEl.textContent = msg;
        errorEl.classList.remove("d-none");
    }

    function clearError() {
        if (errorEl) {
            errorEl.textContent = "";
            errorEl.classList.add("d-none");
        }
    }

    // Cargar carrito desde la API
    async function loadCart() {
        clearError();

        try {
            const res = await fetch("/api/cart", {
                method: "GET",
                credentials: "include"
            });

            if (res.status === 401) {
                // No logueado → login
                window.location.href = "/pages/login.html";
                return;
            }

            const data = await res.json();
            console.log("DEBUG carrito:", data);

            const items = data.items || [];
            const total = data.total || 0;

            if (items.length === 0) {
                if (emptyEl) emptyEl.classList.remove("d-none");
                if (contentEl) contentEl.classList.add("d-none");
                if (totalEl) totalEl.textContent = "0,00 €";
                return;
            }

            if (emptyEl) emptyEl.classList.add("d-none");
            if (contentEl) contentEl.classList.remove("d-none");

            if (tbodyEl) tbodyEl.innerHTML = "";

            /*items.forEach(item => {
                const tr = document.createElement("tr");

                const tallaActual = item.talla || "M";

                tr.innerHTML = `
        <td>${item.nombre}</td>

        <td>
            <select class="form-select form-select-sm cart-size-select"
                    data-item-id="${item.item_id}">
                <option value="S"  ${tallaActual === "S" ? "selected" : ""}>S</option>
                <option value="M"  ${tallaActual === "M" ? "selected" : ""}>M</option>
                <option value="L"  ${tallaActual === "L" ? "selected" : ""}>L</option>
                <option value="XL" ${tallaActual === "XL" ? "selected" : ""}>XL</option>
            </select>
        </td>

        <td>${Number(item.precio).toFixed(2)} €</td>
        <td>${item.cantidad}</td>
        <td>${Number(item.total_linea).toFixed(2)} €</td>
        <td class="text-end">
            <div class="btn-group btn-group-sm" role="group">
                <button class="btn btn-success btn-inc-item"
                        title="Añadir una unidad"
                        data-product-id="${item.product_id}">
                    Añadir
                </button>
                <button class="btn btn-danger btn-dec-item"
                        title="Quitar una unidad"
                        data-item-id="${item.item_id}">
                    Eliminar
                </button>
            </div>
        </td>
    `;

                tbodyEl.appendChild(tr);
            });*/
            items.forEach(item => {
                const tr = document.createElement("tr");

                const tallaActual = item.talla || "M";
                const imagen = item.imagen && item.imagen.trim() !== ""
                    ? item.imagen
                    : "/img/clothes/TH-shirt.jpg"; // fallback

                tr.innerHTML = `
                                    <td>
                                        <div class="cart-item-main">
                                            <div class="cart-item-text">
                                                <div class="cart-item-name fw-semibold">
                                                    ${item.nombre}
                                                </div>
                                                <div class="cart-item-size mt-1">
                                                    <span class="text-muted small me-2">Talla:</span>
                                                    <select class="form-select form-select-sm cart-size-select d-inline-block w-auto"
                                                            data-item-id="${item.item_id}">
                                                        <option value="S"  ${tallaActual === "S" ? "selected" : ""}>S</option>
                                                        <option value="M"  ${tallaActual === "M" ? "selected" : ""}>M</option>
                                                        <option value="L"  ${tallaActual === "L" ? "selected" : ""}>L</option>
                                                        <option value="XL" ${tallaActual === "XL" ? "selected" : ""}>XL</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="cart-item-thumb ms-3">
                                                <img src="${imagen}" alt="${item.nombre}">
                                            </div>
                                        </div>
                                    </td>

                                    <td>${Number(item.precio).toFixed(2)} €</td>
                                    <td>${item.cantidad}</td>
                                    <td>${Number(item.total_linea).toFixed(2)} €</td>
                                    <td class="text-end">
                                        <div class="btn-group btn-group-sm" role="group">
                                            <button class="btn btn-success btn-inc-item"
                                                    title="Añadir una unidad"
                                                    data-product-id="${item.product_id}">
                                                Añadir
                                            </button>
                                            <button class="btn btn-danger btn-dec-item"
                                                    title="Quitar una unidad"
                                                    data-item-id="${item.item_id}">
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                `;

                tbodyEl.appendChild(tr);
            });





            if (totalEl) {
                totalEl.textContent = `${Number(total).toFixed(2)} €`;
            }

            // Asignar eventos a los botones de eliminar
            // Botones de +1
            const incButtons = document.querySelectorAll(".btn-inc-item");
            incButtons.forEach(btn => {
                btn.addEventListener("click", () => {
                    const productId = btn.getAttribute("data-product-id");
                    incrementItem(productId);
                });
            });

            // Botones de -1
            const decButtons = document.querySelectorAll(".btn-dec-item");
            decButtons.forEach(btn => {
                btn.addEventListener("click", () => {
                    const itemId = btn.getAttribute("data-item-id");
                    decrementItem(itemId);
                });
            });


        } catch (err) {
            console.error("Error cargando carrito:", err);
            showError("Ha ocurrido un error al cargar tu carrito.");
        }
    }

    // Sumar 1 unidad usando la misma ruta que el catálogo
    async function incrementItem(productId) {
        try {
            const res = await fetch("/api/cart/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    productId: productId,
                    cantidad: 1,
                    talla: "M"
                })
            });

            if (res.status === 401) {
                window.location.href = "/pages/login.html";
                return;
            }

            const data = await res.json();
            console.log("incrementItem:", data);

            if (!data.success) {
                showError(data.error || "No se pudo aumentar la cantidad.");
                return;
            }

            await loadCart();

        } catch (err) {
            console.error("Error en incrementItem:", err);
            showError("Error al aumentar la cantidad.");
        }
    }

    // Restar 1 unidad usando la nueva ruta /decrement
    async function decrementItem(itemId) {
        try {
            const res = await fetch(`/api/cart/item/${itemId}/decrement`, {
                method: "POST",
                credentials: "include"
            });

            if (res.status === 401) {
                window.location.href = "/pages/login.html";
                return;
            }

            const data = await res.json();
            console.log("decrementItem:", data);

            if (!data.success) {
                showError(data.error || "No se pudo disminuir la cantidad.");
                return;
            }

            await loadCart();

        } catch (err) {
            console.error("Error en decrementItem:", err);
            showError("Error al disminuir la cantidad.");
        }
    }

    // Selects de talla
    const sizeSelects = document.querySelectorAll(".cart-size-select");
    sizeSelects.forEach(select => {
        select.addEventListener("change", () => {
            const itemId = select.getAttribute("data-item-id");
            const nuevaTalla = select.value;
            updateItemSize(itemId, nuevaTalla);
        });
    });

    // Cambiar talla de un ítem del carrito
    async function updateItemSize(itemId, talla) {
        clearError();

        try {
            const res = await fetch(`/api/cart/item/${itemId}/size`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ talla })
            });

            if (res.status === 401) {
                window.location.href = "/pages/login.html";
                return;
            }

            const data = await res.json();
            console.log("updateItemSize:", data);

            if (!data.success) {
                showError(data.error || "No se pudo actualizar la talla.");
                return;
            }

            // Si quieres recargar el carrito entero (por si cambia algo más)
            // await loadCart();
            // De momento, no hace falta recargar porque solo cambia texto/estado del select

        } catch (err) {
            console.error("Error en updateItemSize:", err);
            showError("Error al actualizar la talla.");
        }
    }

    // Eliminar un item del carrito
    async function removeItem(itemId) {
        try {
            const res = await fetch(`/api/cart/item/${itemId}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (res.status === 401) {
                window.location.href = "/pages/login.html";
                return;
            }

            const data = await res.json();
            console.log("removeItem:", data);

            if (!data.success) {
                showError(data.error || "No se pudo eliminar el producto.");
                return;
            }

            await loadCart();
        } catch (err) {
            console.error("Error al eliminar item:", err);
            showError("Error al eliminar el producto del carrito.");
        }
    }

    // Vaciar carrito
    async function clearCart() {
        try {
            const res = await fetch("/api/cart/clear", {
                method: "POST",
                credentials: "include"
            });

            if (res.status === 401) {
                window.location.href = "/pages/login.html";
                return;
            }

            const data = await res.json();
            console.log("clearCart:", data);

            if (!data.success) {
                showError(data.error || "No se pudo vaciar el carrito.");
                return;
            }

            await loadCart();
        } catch (err) {
            console.error("Error al vaciar carrito:", err);
            showError("Error al vaciar el carrito.");
        }
    }

    // Checkout (simular pago)
    async function checkout() {
        try {
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

            // Aquí puedes redirigir a una página de "gracias" si quieres
            alert(`Pedido realizado correctamente. Total: ${Number(data.total).toFixed(2)} €`);

            await loadCart();
        } catch (err) {
            console.error("Error en checkout:", err);
            showError("Error al procesar el pago.");
        }
    }

    // Eventos de botones de la parte inferior
    if (btnClear) {
        btnClear.addEventListener("click", () => {
            clearCart();
        });
    }

    // Go to Purchase Process
    if (btnPay) {
        btnPay.addEventListener("click", () => {
            //checkout();
            window.location.href = "/pages/checkout.html";
        });
    }

    // Cargar carrito al entrar en la página
    //loadCart();
    if (contentEl) {
        loadCart();
    }
});
