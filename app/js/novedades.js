// app/js/novedades.js

document.addEventListener("DOMContentLoaded", () => {
    const errorEl = document.getElementById("novedadesError");
    const listaEl = document.getElementById("novedadesLista");

    function showError(msg) {
        if (!errorEl) return;
        errorEl.textContent = msg;
        errorEl.classList.remove("d-none");
    }

    async function cargarNovedades() {
        try {
            const res = await fetch("/productos/novedades");

            if (!res.ok) {
                showError("No se pudieron cargar las novedades.");
                return;
            }

            const productos = await res.json();
            console.log("DEBUG novedades:", productos);

            listaEl.innerHTML = "";

            if (!Array.isArray(productos) || productos.length === 0) {
                listaEl.innerHTML = `
                    <div class="col-12">
                        <p class="text-center text-muted">
                            De momento no hay novedades disponibles.
                        </p>
                    </div>
                `;
                return;
            }

            productos.forEach(prod => {
                const col = document.createElement("div");
                col.className = "col-12 col-sm-6 col-md-4 col-lg-3";

                col.innerHTML = `
                    <div class="card shadow-sm border-0 h-100">
                        <img src="${prod.imagen || 'https://via.placeholder.com/400x500'}"
                             class="card-img-top"
                             alt="${prod.nombre}">
                        <div class="card-body d-flex flex-column text-center">
                            <h5 class="fw-bold">${prod.nombre}</h5>
                            <p class="text-muted small mb-1">${prod.descripcion || ''}</p>
                            <p class="fw-semibold mb-3">${prod.precio} €</p>
                            <button class="btn btn-dark mt-auto w-100 btn-add-cart"
                                    data-product-id="${prod.id}">
                                Añadir al carrito
                            </button>
                        </div>
                    </div>
                `;

                listaEl.appendChild(col);
            });

            // Reutilizamos la lógica de addToCart del catálogo:
            const botones = document.querySelectorAll(".btn-add-cart");
            botones.forEach(btn => {
                btn.addEventListener("click", async () => {
                    const productId = btn.getAttribute("data-product-id");

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
                            // No logueado
                            alert("Debes iniciar sesión para añadir productos al carrito.");
                            window.location.href = "/pages/login.html";
                            return;
                        }

                        const data = await res.json();

                        if (!data.success) {
                            alert(data.error || "No se pudo añadir al carrito.");
                            return;
                        }

                        alert("Producto añadido al carrito ✅");
                    } catch (err) {
                        console.error("Error al añadir desde novedades:", err);
                        alert("Error al añadir al carrito.");
                    }
                });
            });

        } catch (err) {
            console.error("Error cargando novedades:", err);
            showError("Ha ocurrido un error al cargar las novedades.");
        }
    }

    cargarNovedades();
});
