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

            items.forEach(item => {
                const tr = document.createElement("tr");

                tr.innerHTML = `
                                <td>${item.nombre}</td>
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
                    cantidad: 1
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

    if (btnPay) {
        btnPay.addEventListener("click", () => {
            checkout();
        });
    }

    // Cargar carrito al entrar en la página
    loadCart();
});
