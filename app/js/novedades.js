// app/js/novedades.js

document.addEventListener('DOMContentLoaded', () => {
    loadNovedades();
});

function showNovedadesError(msg) {
    const alertEl = document.getElementById('ropaError'); // si usas otro id en novedades, cámbialo aquí
    if (!alertEl) return;

    alertEl.textContent = msg || 'Debes iniciar sesión para añadir productos al carrito.';
    alertEl.classList.remove('d-none');

    setTimeout(() => {
        alertEl.classList.add('d-none');
    }, 3000);
}

// Navegación a detalle SOLO para las cards de novedades
function activarNavegacionDetalle(container) {
    const cards = container.querySelectorAll(".product-card");

    cards.forEach(card => {
        card.addEventListener("click", (e) => {
            // IMPORTANTE: aquí usamos la MISMA clase que en el botón
            if (e.target.closest(".btn-add-cart")) return;

            const id = card.getAttribute("data-product-id");
            if (!id) return;

            window.location.href = `/pages/producto.html?id=${id}`;
        });
    });
}

async function loadNovedades() {
    const container = document.getElementById('novedadesContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="col-12 text-center">
            <p>Cargando novedades...</p>
        </div>
    `;

    try {
        const res = await fetch('/productos/novedades');

        if (!res.ok) {
            throw new Error('Error al cargar novedades');
        }

        const productos = await res.json();

        if (!productos || productos.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <p>No hay novedades disponibles por ahora.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        productos.forEach(prod => {
            const col = document.createElement('div');
            col.className = 'col';

            const imgSrc =
                prod.imagen && prod.imagen.trim() !== ''
                    ? prod.imagen
                    : 'https://via.placeholder.com/400x500?text=Sin+imagen';

            col.innerHTML = `
                <div class="card shadow-sm border-0 h-100 product-card" data-product-id="${prod.id}">
                    <img src="${imgSrc}" class="card-img-top" alt="${prod.nombre}">
                    <div class="card-body text-center d-flex flex-column">
                        <h5 class="fw-bold">${prod.nombre}</h5>
                        <p class="text-muted mb-1">
                            ${prod.descripcion ? prod.descripcion : ''}
                        </p>
                        <p class="fw-semibold mb-3">
                            ${Number(prod.precio).toFixed(2)} €
                        </p>
                        <button class="btn btn-dark mt-auto w-100 btn-add-cart"
                                data-product-id="${prod.id}">
                            Agregar al carrito
                        </button>
                    </div>
                </div>
            `;

            container.appendChild(col);
        });

        // 👉 activar navegación a detalle para estas cards
        activarNavegacionDetalle(container);

        // Delegación de eventos para "Agregar al carrito"
        container.addEventListener('click', async (e) => {
            const btn = e.target.closest('.btn-add-cart');
            if (!btn) return;

            const productId = btn.getAttribute('data-product-id');
            if (!productId) return;

            try {
                const res = await fetch('/api/cart/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        productId: productId,
                        cantidad: 1
                    })
                });

                if (res.status === 401) {
                    showNovedadesError('Debes iniciar sesión para añadir productos al carrito.');
                    return;
                }

                const data = await res.json();
                console.log('Agregar desde novedades:', data);

                if (!data.success) {
                    showNovedadesError(data.error || 'No se pudo añadir el producto al carrito.');
                    return;
                }

                // Aquí podrías mostrar un mensaje bonito de éxito si quieres

            } catch (err) {
                console.error('Error al añadir al carrito desde novedades:', err);
                showNovedadesError('Ha ocurrido un error al añadir el producto.');
            }
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-danger">Error al cargar las novedades.</p>
            </div>
        `;
    }
}
