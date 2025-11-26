// app/js/productDetail.js

document.addEventListener("DOMContentLoaded", async () => {
    const errorBox      = document.getElementById("productDetailError");
    const loginErrorBox = document.getElementById("productDetailLoginError");
    const titleEl       = document.getElementById("productTitle");
    const descEl        = document.getElementById("productDescription");
    const priceEl       = document.getElementById("productPrice");
    const imageEl       = document.getElementById("productImage");
    const btnAdd        = document.getElementById("btnAddToCartDetail");

    let isLogged = false;
    let currentProduct = null;

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

    // 1. Averiguar el ID de producto desde la URL: ?id=XX
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    if (!productId) {
        showError("No se ha indicado ningún producto.");
        return;
    }

    // 2. Comprobar si hay usuario logueado (para el comportamiento del botón)
    try {
        const data = await fetchCurrentUser(); // de auth.js
        isLogged = !!(data && data.autenticado);
        console.log("DEBUG detalle producto → usuario logueado:", isLogged);
    } catch (err) {
        console.error("Error comprobando usuario:", err);
    }

    // 3. Cargar el producto desde /productos (y filtrar por ID)
    try {
        clearError();

        const res = await fetch("/productos");
        if (!res.ok) {
            showError("No se pudo cargar la información del producto.");
            return;
        }

        const productos = await res.json();
        const idNum = Number(productId);
        currentProduct = productos.find(p => Number(p.id) === idNum);

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
            // Si el producto tiene ruta de imagen, úsala; si no, usamos la camiseta por defecto
            const imgSrc = currentProduct.imagen && currentProduct.imagen.trim() !== ""
                ? currentProduct.imagen
                : "/img/clothes/TH-shirt.jpg";

            imageEl.src = imgSrc;
            imageEl.alt = currentProduct.nombre || "Producto UrbanVogue";
        }

    } catch (err) {
        console.error("Error cargando producto:", err);
        showError("Ha ocurrido un error al cargar el producto.");
        return;
    }

    // 5. Comportamiento del botón "AGREGAR AL CARRITO"
    if (btnAdd) {
        btnAdd.addEventListener("click", async () => {
            if (!currentProduct) return;

            // Si NO está logueado → mensaje rojo, pero NO redirigir
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
                        cantidad: 1
                    })
                });

                if (res.status === 401) {
                    // Por seguridad, si la sesión ha expirado
                    showLoginError();
                    return;
                }

                const data = await res.json();
                console.log("DEBUG detalle producto → addCart:", data);

                if (!data.success) {
                    showError(data.error || "No se pudo añadir el producto al carrito.");
                    return;
                }

                // Mini feedback rápido (puedes mejorarlo luego con un toast bonito)
                alert("Producto añadido al carrito.");

            } catch (err) {
                console.error("Error al añadir al carrito:", err);
                showError("Error al añadir el producto al carrito.");
            }
        });
    }
});
