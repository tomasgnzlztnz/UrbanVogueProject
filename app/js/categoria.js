function showAlert(message, type = "danger") {
    const alertBox = document.getElementById("alertBox");
    if (!alertBox) return;

    alertBox.innerHTML = `
        <div class="alert alert-${type} text-center" role="alert">
            ${message}
        </div>
    `;

    // Desvanecer después de 3 segundos
    setTimeout(() => {
        alertBox.innerHTML = "";
    }, 3000);
}


// app/js/categoria.js

// 1. Obtener categoría desde la URL (?cat=camisetas)
const params = new URLSearchParams(window.location.search);
const categoriaSlug = params.get("cat"); // camisetas, sudaderas, pantalones

const tituloEl = document.getElementById("categoriaTitulo");
const listaEl  = document.getElementById("listaProductos");

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
            credentials: "include", // MUY IMPORTANTE para que mande la cookie de sesión
            body: JSON.stringify({
                productId: productId,
                cantidad: 1
            })
        });

        if (res.status === 401) {
            showAlert("Debes iniciar sesión para añadir productos al carrito.", "danger");
            setTimeout(() => {
                //window.location.href = "/pages/login.html";
            }, 3000); // un poquito de tiempo para que vea el mensaje
            return;
        }


        const data = await res.json();
        console.log("Respuesta carrito:", data);

        if (data.success) {
            alert("Producto añadido al carrito ✅");
        } else {
            alert(data.error || "No se pudo añadir al carrito.");
        }

    } catch (err) {
        console.error("Error en addToCart():", err);
        alert("Error al añadir al carrito.");
    }
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
            `;
            listaEl.appendChild(card);
        });

        // Añadimos listeners a todos los botones de "Añadir al carrito"
        const botones = document.querySelectorAll(".btn-add-cart");
        botones.forEach(btn => {
            btn.addEventListener("click", () => {
                const productId = btn.getAttribute("data-product-id");
                addToCart(productId);
            });
        });

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
