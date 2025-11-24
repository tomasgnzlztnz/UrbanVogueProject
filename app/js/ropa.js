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

        productos.forEach(prod => {
            const col = document.createElement('div');
            col.className = 'col';

            const imgSrc =
                prod.imagen && prod.imagen.trim() !== ''
                    ? prod.imagen
                    : 'https://via.placeholder.com/400x500?text=Sin+imagen';

            col.innerHTML = `
                <div class="card shadow-sm border-0 h-100">
                    <img src="${imgSrc}" class="card-img-top" alt="${prod.nombre}">
                    <div class="card-body text-center d-flex flex-column">
                        <h5 class="fw-bold">${prod.nombre}</h5>
                        <p class="text-muted mb-1">
                            ${prod.descripcion ? prod.descripcion : ''}
                        </p>
                        <p class="fw-semibold mb-3">
                            ${Number(prod.precio).toFixed(2)} €
                        </p>
                        <button class="btn btn-dark mt-auto w-100 btn-add-to-cart"
                                data-product-id="${prod.id}">
                            Agregar al carrito
                        </button>
                    </div>
                </div>
            `;

            container.appendChild(col);
        });

        // Delegación de eventos: clic en "Agregar al carrito"
        container.addEventListener('click', async (e) => {
            if (!e.target.classList.contains('btn-add-to-cart')) return;

            const productId = e.target.getAttribute('data-product-id');
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

                // Si quieres, aquí podrías mostrar un mensaje de éxito discreto
                // o dejarlo "silencioso".
            } catch (err) {
                console.error('Error al añadir al carrito desde ropa:', err);
                showRopaError('Ha ocurrido un error al añadir el producto.');
            }
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-danger">Error al cargar los productos.</p>
            </div>
        `;
    }
}
