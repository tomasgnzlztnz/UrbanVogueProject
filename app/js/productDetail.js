document.addEventListener("DOMContentLoaded", async () => {
    const errorBox = document.getElementById("productDetailError");
    const loginErrorBox = document.getElementById("productDetailLoginError");
    const titleEl = document.getElementById("productTitle");
    const descEl = document.getElementById("productDescription");
    const priceEl = document.getElementById("productPrice");
    const imageEl = document.getElementById("productImage");
    const btnAdd = document.getElementById("btnAddToCartDetail");

    // 👉 nuevo: contenedor de productos relacionados
    const relatedContainer = document.getElementById("relatedProducts");

    let isLogged = false;
    let currentProduct = null;

    const sizeButtons = document.querySelectorAll(".size-option");
    let selectedSize = null;

    sizeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            sizeButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedSize = btn.getAttribute("data-size");
            console.log("Talla seleccionada:", selectedSize);
        });
    });

    function showError(msg) {
        if (!errorBox) return;
        errorBox.textContent = msg;
        errorBox.classList.remove("d-none");
    }

    function clearError() {
        if (!errorBox) return;
        errorBox.textContent = "";
        errorBox.classList.add("d-none");
    }

    function showLoginError() {
        if (!loginErrorBox) return;
        loginErrorBox.classList.remove("d-none");
        setTimeout(() => {
            loginErrorBox.classList.add("d-none");
        }, 3000);
    }

    // 👉 función auxiliar para pintar productos relacionados
    function renderRelatedProducts(allProducts, product) {
        if (!relatedContainer || !product) return;

        // Quitamos el producto actual de la lista
        const others = allProducts.filter(p => Number(p.id) !== Number(product.id));

        if (others.length === 0) {
            relatedContainer.innerHTML = `
                <div class="col-12">
                    <p class="text-center text-muted mb-0">
                        No hay más productos por ahora.
                    </p>
                </div>
            `;
            return;
        }

        // Mezclamos un poco el array y cogemos 4
        const shuffled = [...others].sort(() => Math.random() - 0.5);
        const seleccion = shuffled.slice(0, 4);

        relatedContainer.innerHTML = "";

        seleccion.forEach(prod => {
            const col = document.createElement("div");
            col.className = "col";

            const imgSrc = prod.imagen && prod.imagen.trim() !== ""
                ? prod.imagen
                : "/img/clothes/TH-shirt.jpg";

            const precio = Number(prod.precio || 0).toFixed(2);

            col.innerHTML = `
                <div class="card shadow-sm border-0 h-100 product-card"
                     data-product-id="${prod.id}"
                     style="cursor:pointer;">
                    <img src="${imgSrc}" class="card-img-top" alt="${prod.nombre}">
                    <div class="card-body d-flex flex-column text-center">
                        <h6 class="fw-bold product-card-title mb-1">
                            ${prod.nombre}
                        </h6>
                        <p class="fw-semibold mb-3">${precio} €</p>
                        <button class="btn btn-outline-dark btn-sm mt-auto btn-ver-detalle">
                            Ver producto
                        </button>
                    </div>
                </div>
            `;

            relatedContainer.appendChild(col);
        });

        // Click en las cards → ir al detalle
        const cards = relatedContainer.querySelectorAll(".product-card");
        cards.forEach(card => {
            card.addEventListener("click", (e) => {
                // Permitimos que se haga click en cualquier parte de la card
                const id = card.getAttribute("data-product-id");
                if (!id) return;
                window.location.href = `/pages/producto.html?id=${id}`;
            });
        });
    }

    // 1. ID del producto en la URL
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    if (!productId) {
        showError("No se ha indicado ningún producto.");
        return;
    }

    // 2. Comprobar usuario logueado
    try {
        const data = await fetchCurrentUser(); // de auth.js
        isLogged = !!(data && data.autenticado);
        console.log("DEBUG detalle producto → usuario logueado:", isLogged);
    } catch (err) {
        console.error("Error comprobando usuario:", err);
    }

    // 3. Cargar todos los productos y localizar el actual
    let todosLosProductos = [];
    try {
        clearError();

        const res = await fetch("/productos");
        if (!res.ok) {
            showError("No se pudo cargar la información del producto.");
            return;
        }

        todosLosProductos = await res.json();
        const idNum = Number(productId);
        currentProduct = todosLosProductos.find(p => Number(p.id) === idNum);

        if (!currentProduct) {
            showError("Producto no encontrado.");
            return;
        }

        // 4. Pintar datos en la vista
        if (titleEl) {
            titleEl.textContent = (currentProduct.nombre || "").toUpperCase();
        }

        if (descEl) {
            descEl.textContent = currentProduct.descripcion || "Descripción no disponible.";
        }

        if (priceEl) {
            const precio = Number(currentProduct.precio || 0);
            priceEl.textContent = `${precio.toFixed(2)} €`;
        }

        if (imageEl) {
            const imgSrc = currentProduct.imagen && currentProduct.imagen.trim() !== ""
                ? currentProduct.imagen
                : "/img/clothes/TH-shirt.jpg";

            imageEl.src = imgSrc;
            imageEl.alt = currentProduct.nombre || "Producto UrbanVogue";
        }

        // 👉 aquí pintamos los productos extra
        renderRelatedProducts(todosLosProductos, currentProduct);

    } catch (err) {
        console.error("Error cargando producto:", err);
        showError("Ha ocurrido un error al cargar el producto.");
        return;
    }

    // 5. Botón "AGREGAR AL CARRITO"
    if (btnAdd) {
        btnAdd.addEventListener("click", async () => {
            if (!currentProduct) return;

            if (!isLogged) {
                showLoginError();
                return;
            }

            try {
                const res = await fetch("/api/cart/add", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        productId: currentProduct.id,
                        cantidad: 1,
                        talla: selectedSize || "M"
                    })
                });

                if (res.status === 401) {
                    showLoginError();
                    return;
                }

                const data = await res.json();
                console.log("DEBUG detalle producto → addCart:", data);

                if (!data.success) {
                    showError(data.error || "No se pudo añadir el producto al carrito.");
                    return;
                }

                alert("Producto añadido al carrito.");

            } catch (err) {
                console.error("Error al añadir al carrito:", err);
                showError("Error al añadir el producto al carrito.");
            }
        });
    }
});
