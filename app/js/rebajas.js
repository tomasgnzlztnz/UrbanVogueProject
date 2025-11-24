// rebajas.js (función loadRebajas corregida)

// Esto asumo que ya lo tienes arriba:
const cardsContainer = document.getElementById('rebajasContainer'); 
const ropaError = document.getElementById('ropaError');

// Función para mostrar el mensaje de "debes iniciar sesión"
function showLoginRequiredMessage() {
    if (!ropaError) return;
    ropaError.textContent = "Debes iniciar sesión para añadir productos al carrito.";
    ropaError.classList.remove("d-none");

    setTimeout(() => {
        ropaError.classList.add("d-none");
        ropaError.textContent = "";
    }, 3000);
}

async function loadRebajas() {
    try {
        const res = await fetch("/productos/rebajas");
        const data = await res.json();

        console.log("DEBUG rebajas → productos:", data);

        if (!cardsContainer) return;
        cardsContainer.innerHTML = "";

        // data = [ { categoria: "...", productos: [...] }, ... ]
        data.forEach(grupo => {
            const listaProductos = grupo.productos || [];

            listaProductos.forEach(prod => {
                const col = document.createElement("div");
                col.className = "col";

                const nombre = prod.nombre || "Producto sin nombre";
                const descripcion = prod.descripcion || "";
                const precioNum = Number(prod.precio);
                const precioTexto = isNaN(precioNum)
                    ? "Consultar"
                    : `${precioNum.toFixed(2)} €`;

                const imgSrc =
                    prod.imagen && String(prod.imagen).trim() !== ""
                        ? prod.imagen
                        : "https://via.placeholder.com/400x500?text=Sin+imagen";

                col.innerHTML = `
                    <div class="card shadow-sm border-0 h-100">
                        <img src="${imgSrc}" class="card-img-top" alt="${nombre}">
                        <div class="card-body text-center d-flex flex-column">
                            <h6 class="text-muted mb-1">${grupo.categoria}</h6>
                            <h5 class="fw-bold">${nombre}</h5>
                            <p class="text-muted mb-1">${descripcion}</p>
                            <p class="fw-semibold mb-3">${precioTexto}</p>
                            <button class="btn btn-dark mt-auto w-100 btn-add-to-cart"
                                    data-product-id="${prod.id}">
                                Agregar al carrito
                            </button>
                        </div>
                    </div>
                `;

                cardsContainer.appendChild(col);
            });
        });

        // Ahora conectamos los botones "Agregar al carrito"
        const buttons = document.querySelectorAll(".btn-add-to-cart");
        buttons.forEach(btn => {
            btn.addEventListener("click", async () => {
                const productId = btn.getAttribute("data-product-id");

                try {
                    // Intentamos añadir al carrito
                    const resAdd = await fetch("/api/cart/add", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                            productId: productId,
                            cantidad: 1
                        })
                    });

                    if (resAdd.status === 401) {
                        // No logueado → solo mostramos mensaje, NO redirigimos
                        showLoginRequiredMessage();
                        return;
                    }

                    const dataAdd = await resAdd.json();
                    console.log("add-to-cart rebajas:", dataAdd);

                    if (!dataAdd.success) {
                        alert(dataAdd.error || "No se pudo añadir al carrito.");
                    } else {
                        // Aquí si quieres puedes mostrar un mensajito de éxito
                        // o un toast más adelante
                    }

                } catch (err) {
                    console.error("Error al agregar al carrito desde rebajas:", err);
                    showLoginRequiredMessage();
                }
            });
        });

    } catch (err) {
        console.error("Error cargando rebajas:", err);
    }
}

// Llamada inicial
document.addEventListener("DOMContentLoaded", () => {
    loadRebajas();
});
