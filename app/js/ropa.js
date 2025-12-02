// app/js/ropa.js

document.addEventListener('DOMContentLoaded', () => {
    loadCategorias();
    loadAllProducts();
});

function showRopaError(msg) {
    const alertEl = document.getElementById('ropaError');
    if (!alertEl) return;

    alertEl.textContent = msg || 'Debes iniciar sesión para añadir productos al carrito.';
    alertEl.classList.remove('d-none');

    // Ocultar a los 3 segundos
    setTimeout(() => {
        alertEl.classList.add('d-none');
    }, 3000);
}

// Navegación a la vista de detalle
function activarNavegacionDetalle() {
    const cards = document.querySelectorAll(".product-card");

    cards.forEach(card => {
        card.addEventListener("click", (e) => {
            // Si el click viene del botón "Agregar al carrito",
            // NO navegamos al detalle
            if (e.target.closest(".btn-add-cart")) {
                return;
            }

            const id = card.getAttribute("data-product-id");
            if (!id) return;

            window.location.href = `/pages/producto.html?id=${id}`;
        });
    });
}

async function loadCategorias() {
    const container = document.getElementById('categoryList');
    if (!container) return;

    container.innerHTML = `
        <div class="col-12 text-center">
            <p>Cargando categorías...</p>
        </div>
    `;

    try {
        const res = await fetch('/categorias');
        if (!res.ok) {
            throw new Error("Error al cargar categorías");
        }

        const categorias = await res.json();

        if (!Array.isArray(categorias) || categorias.length === 0) {
            container.innerHTML = `<div class="col-12 text-center"><p class="text-muted">De momento no hay categorías disponibles.</p></div>`;
            return;
        }

        container.innerHTML = "";

        categorias.forEach(cat => {
            // Omitir la categoría "Accesorios" en la página de Ropa porque ya tiene una sección propia.
            //if (cat.nombre && cat.nombre.toLowerCase() === "accesorios") {
            if (cat.nombre && cat.nombre.toLowerCase() != "accesorios") {   
                const col = document.createElement('div');
                col.className = "col-10 col-md-4";
                col.innerHTML = `
                <a href="/pages/categoria.html?cat=${cat.id}" class="text-decoration-none">
                <div class="category-card p-4 shadow-sm text-center textsection-clothes">
                <h3>${cat.nombre}</h3>
                </div>
                </a>
                `;
                container.appendChild(col);
            }
        });


    } catch (err) {
        console.error("Error al cargar categorías:", err);
        container.innerHTML = `<div class="col-12 text-center"><p class="text-danger">Error al cargar las categorías.</p></div>`;
    }
}


async function loadAllProducts() {
    const container = document.getElementById('allProductsContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="col-12 text-center">
            <p>Cargando productos...</p>
        </div>
    `;

    try {
        const res = await fetch('/productos');

        if (!res.ok) {
            throw new Error('Error al cargar productos');
        }

        const productos = await res.json();

        if (!productos || productos.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <p>No hay productos disponibles en este momento.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        productos.forEach(p => {
            const col = document.createElement("div");
            col.classList.add("col");

            col.innerHTML = `
                <div class="card shadow-sm border-0 product-card"
                     data-product-id="${p.id}">
                    <img src="${p.imagen || '/img/clothes/TH-shirt.jpg'}"
                         class="card-img-top"
                         alt="${p.nombre}">
                    <div class="card-body text-center">
                        <h5 class="fw-bold">${p.nombre}</h5>
                        <p class="text-muted mb-1">${p.descripcion || ''}</p>
                        <p class="fw-semibold mb-3">${Number(p.precio).toFixed(2)} €</p>
                        <button class="btn btn-dark w-100 btn-add-cart"
                                data-product-id="${p.id}">
                            Agregar al carrito
                        </button>
                    </div>
                </div>
            `;

            container.appendChild(col);
        });

        // Delegación de eventos: clic en "Agregar al carrito"
        container.addEventListener('click', async (e) => {
            const btn = e.target.closest('.btn-add-cart');
            if (!btn) return;

            const productId = btn.getAttribute('data-product-id');
            if (!productId) return;

            try {
                const res = await fetch('/api/cart/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        productId: productId,
                        cantidad: 1
                    })
                });

                // No logueado → mostramos mensaje y NO redirigimos
                if (res.status === 401) {
                    showRopaError('Debes iniciar sesión para añadir productos al carrito.');
                    return;
                }

                const data = await res.json();
                console.log('Agregar desde ropa:', data);

                if (!data.success) {
                    showRopaError(data.error || 'No se pudo añadir el producto al carrito.');
                    return;
                }

                // Aquí podrías mostrar un mensaje de éxito si quieres
                // Feedback visual en el botón: "Añadido correctamente"
                const originalText = btn.textContent;
                const originalClasses = btn.className;

                // Cambiamos a estilo "éxito"
                btn.disabled = true;
                btn.textContent = "Añadido correctamente";
                btn.classList.remove("btn-dark");
                btn.classList.add("btn-success");

                setTimeout(() => {
                    // Volvemos al estado normal
                    btn.disabled = false;
                    btn.textContent = originalText;
                    btn.className = originalClasses;
                }, 2000);

                //

            } catch (err) {
                console.error('Error al añadir al carrito desde ropa:', err);
                showRopaError('Ha ocurrido un error al añadir el producto.');
            }
        });

        // Activar la navegación a detalle una vez pintadas las cards
        activarNavegacionDetalle();

    } catch (err) {
        console.error(err);
        container.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-danger">Error al cargar los productos.</p>
            </div>
        `;
    }
}
