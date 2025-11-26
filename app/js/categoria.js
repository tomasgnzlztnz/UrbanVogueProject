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

// 1. Obtener categoría desde la URL (?cat=camisetas)
const params = new URLSearchParams(window.location.search);
const categoriaSlug = params.get("cat"); // camisetas, sudaderas, pantalones

const tituloEl = document.getElementById("categoriaTitulo");
const listaEl = document.getElementById("listaProductos");

// Si no hay categoría en la URL, mostramos algo genérico
if (!categoriaSlug) {
    tituloEl.textContent = "Productos";
} else {
    tituloEl.textContent = categoriaSlug.toUpperCase();
}

// Función para llamar a la API de carrito
async function addToCart(productId) {
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

        showAlert("Producto añadido al carrito ✅", "success");

    } catch (err) {
        console.error("Error en addToCart():", err);
        showAlert("Error al añadir al carrito.", "danger");
    }
}

// Navegación a detalle solo dentro de la lista
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

// 2. Llamar al backend para obtener productos de esa categoría
async function cargarProductosPorCategoria() {
    if (!categoriaSlug) return;

    try {
        const response = await fetch(`/productos/categoria/${categoriaSlug}`);
        const productos = await response.json();

        console.log("DEBUG productos categoria:", productos);

        listaEl.innerHTML = "";

        if (!Array.isArray(productos) || productos.length === 0) {
            listaEl.innerHTML = `
                <div class="col-12">
                    <p class="text-center text-muted">No hay productos en esta categoría.</p>
                </div>
            `;
            return;
        }

        productos.forEach(prod => {
            const card = document.createElement("div");
            card.className = "col-12 col-sm-6 col-md-4 col-lg-3";

            card.innerHTML = `
                <div class="card shadow-sm border-0 h-100 product-card" data-product-id="${prod.id}">
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
            listaEl.appendChild(card);
        });

        // Listeners de "Añadir al carrito" SOLO en esta lista
        const botones = listaEl.querySelectorAll(".btn-add-cart");
        botones.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation(); // evita que salte el click de la card
                const productId = btn.getAttribute("data-product-id");
                addToCart(productId);
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
