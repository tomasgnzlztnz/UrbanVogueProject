// app/js/rebajas.js

document.addEventListener("DOMContentLoaded", () => {
    const errorEl = document.getElementById("rebajasError");
    const listaEl = document.getElementById("rebajasLista");

    function showError(msg) {
        if (!errorEl) return;
        errorEl.textContent = msg;
        errorEl.classList.remove("d-none");
    }

    async function cargarRebajas() {
        try {
            const res = await fetch("/productos/rebajas");

            if (!res.ok) {
                showError("No se pudieron cargar las rebajas.");
                return;
            }

            const secciones = await res.json();
            console.log("DEBUG rebajas:", secciones);

            listaEl.innerHTML = "";

            if (!Array.isArray(secciones) || secciones.length === 0) {
                listaEl.innerHTML = `
                    <p class="text-center text-muted">
                        De momento no hay productos en rebajas.
                    </p>
                `;
                return;
            }

            secciones.forEach(section => {
                const { categoria, productos } = section;

                // Si una categoría no tiene productos, podemos omitirla
                if (!productos || productos.length === 0) {
                    return;
                }

                const bloque = document.createElement("section");
                bloque.className = "mb-5";

                let cardsHtml = "";

                productos.forEach(prod => {
                    cardsHtml += `
                        <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
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
                        </div>
                    `;
                });

                bloque.innerHTML = `
                    <h2 class="mb-3">${categoria}</h2>
                    <div class="row">
                        ${cardsHtml}
                    </div>
                `;

                listaEl.appendChild(bloque);
            });

            // Listeners para "Añadir al carrito"
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
                        console.error("Error al añadir desde rebajas:", err);
                        alert("Error al añadir al carrito.");
                    }
                });
            });

        } catch (err) {
            console.error("Error cargando rebajas:", err);
            showError("Ha ocurrido un error al cargar las rebajas.");
        }
    }

    cargarRebajas();
});
