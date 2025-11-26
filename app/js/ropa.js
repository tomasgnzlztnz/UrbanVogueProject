// app/js/ropa.js

document.addEventListener('DOMContentLoaded', () => {
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

            // 👈 aquí usamos *container*, no contenedorProductos
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
