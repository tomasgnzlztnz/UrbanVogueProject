// app/js/categoria.js
function showAlert(message, type = "danger") {
    const alertBox = document.getElementById("alertBox");
    if (!alertBox) return;

    alertBox.innerHTML = `
        <div class="alert alert-${type} text-center" role="alert">
            ${message}
        </div>
    `;

    setTimeout(() => {
        alertBox.innerHTML = "";
    }, 3000);
}

// 1. Obtener categoría desde la URL (?cat=ID)
const params = new URLSearchParams(window.location.search);
const categoriaId = Number(params.get("cat")); // ahora es un ID numérico

const tituloEl = document.getElementById("categoriaTitulo");
const listaEl = document.getElementById("listaProductos");

// Si no hay categoría en la URL
if (!categoriaId || isNaN(categoriaId)) {
    if (tituloEl) tituloEl.textContent = "Productos";
} else {
    if (tituloEl) tituloEl.textContent = "Cargando categoría...";
}

// ============================
//  Añadir al carrito
// ============================
// Recibe el id del producto y el botón que se pulsó
async function addToCart(productId, buttonEl) {
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
                // Si quisieras enviar talla por defecto:
                // talla: "M"
            })
        });

        if (res.status === 401) {
            showAlert("Debes iniciar sesión para añadir productos al carrito.", "danger");
            return;
        }

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            showAlert(data.error || "No se pudo añadir al carrito.", "danger");
            return;
        }

        const data = await res.json();

        if (!data.success) {
            showAlert(data.error || "No se pudo añadir al carrito.", "danger");
            return;
        }

        // Mensaje de alerta arriba
        //showAlert("Producto añadido al carrito", "success");

        // Feedback en el botón (si nos lo han pasado)
        if (buttonEl) {
            const originalText = buttonEl.textContent;
            const originalClasses = buttonEl.className;

            buttonEl.disabled = true;
            buttonEl.textContent = "Añadido correctamente";
            buttonEl.classList.remove("btn-dark");
            buttonEl.classList.add("btn-success");

            setTimeout(() => {
                buttonEl.disabled = false;
                buttonEl.textContent = originalText;
                buttonEl.className = originalClasses;
            }, 2000);
        }

    } catch (err) {
        console.error("Error en addToCart():", err);
        showAlert("Error al añadir al carrito.", "danger");
    }
}

// ============================
//  Navegación a detalle
// ============================
function activarNavegacionDetalle() {
    const cards = listaEl.querySelectorAll(".product-card");

    cards.forEach(card => {
        card.addEventListener("click", (e) => {
            if (e.target.closest(".btn-add-cart")) return;

            const id = card.getAttribute("data-product-id");
            if (!id) return;

            window.location.href = `/pages/producto.html?id=${id}`;
        });
    });
}

// ============================
//  Cargar productos por categoría
// ============================
async function cargarProductosPorCategoria() {
    if (!categoriaId || isNaN(categoriaId)) return;

    try {
        const response = await fetch(`/productos/categoria/${categoriaId}`);

        if (!response.ok) {
            listaEl.innerHTML = `
                <div class="col-12">
                    <p class="text-center text-danger">Error al cargar los productos.</p>
                </div>
            `;
            return;
        }

        const productos = await response.json();
        console.log("DEBUG productos categoria:", productos);

        listaEl.innerHTML = "";

        if (!Array.isArray(productos) || productos.length === 0) {
            if (tituloEl) tituloEl.textContent = "Categoría";
            listaEl.innerHTML = `
                <div class="col-12">
                    <p class="text-center text-muted">No hay productos en esta categoría.</p>
                </div>
            `;
            return;
        }

        // Usamos el nombre de categoría que viene del backend
        const nombreCat = productos[0].categoria_nombre || "Categoría";
        if (tituloEl) tituloEl.textContent = nombreCat;

        productos.forEach(prod => {
            const card = document.createElement("div");
            card.className = "col-12 col-sm-6 col-md-4 col-lg-3";

            const imgSrc = prod.imagen || "https://via.placeholder.com/400x500";

            /*
            card.innerHTML = `
                <div class="card shadow-sm border-0 h-100 product-card" data-product-id="${prod.id}">
                    <img src="${imgSrc}" class="card-img-top" alt="${prod.nombre}">
                    <div class="card-body d-flex flex-column text-center">
                        <h5 class="fw-bold">${prod.nombre}</h5>
                        <p class="text-muted small mb-1">${prod.descripcion || ''}</p>
                        <p class="fw-semibold mb-3">${Number(prod.precio).toFixed(2)} €</p>
                        <button class="btn btn-dark mt-auto w-100 btn-add-cart"
                                data-product-id="${prod.id}">
                            Añadir al carrito
                        </button>
                    </div>
                </div>
            `;
            */
            card.innerHTML = `
                                <div class="card shadow-sm border-0 h-100 product-card" data-product-id="${prod.id}">
                                    <img src="${prod.imagen || 'https://via.placeholder.com/400x500'}"
                                        class="card-img-top"
                                        alt="${prod.nombre}">
                                    <div class="card-body d-flex flex-column text-center">
                                        <h5 class="fw-bold product-card-title">${prod.nombre}</h5>
                                        <p class="text-muted small mb-1">${prod.descripcion || ''}</p>
                                        <p class="fw-semibold mb-3">${Number(prod.precio).toFixed(2)} €</p>
                                        <button class="btn btn-dark mt-auto w-100 btn-add-cart"
                                                data-product-id="${prod.id}">
                                            Añadir al carrito
                                        </button>
                                    </div>
                                </div>
                            `;

            listaEl.appendChild(card);
        });

        // Listeners de "Añadir al carrito" SOLO en esta lista
        const botones = listaEl.querySelectorAll(".btn-add-cart");
        botones.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation(); // no dispare el click de la card
                const productId = btn.getAttribute("data-product-id");
                addToCart(productId, btn); // 👈 le pasamos también el botón
            });
        });

        activarNavegacionDetalle();
    } catch (err) {
        console.error("Error cargando productos por categoría:", err);
        listaEl.innerHTML = `
            <div class="col-12">
                <p class="text-center text-danger">Error al cargar los productos.</p>
            </div>
        `;
    }
}

// 3. Ejecutar al cargar
cargarProductosPorCategoria();
