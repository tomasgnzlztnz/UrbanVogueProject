// app/js/destacados.js

document.addEventListener("DOMContentLoaded", () => {
  const contenedor = document.getElementById("destacadosContainer");
  if (!contenedor) return;

  
  function showRopaError(msg) {
    const alertEl = document.getElementById("ropaError");
    if (!alertEl) return;

    alertEl.textContent =
      msg || "Debes iniciar sesión para añadir productos al carrito.";
    alertEl.classList.remove("d-none");

    setTimeout(() => {
      alertEl.classList.add("d-none");
    }, 3000);
  }

  // Navegación al detalle solo dentro de este contenedor
  function activarNavegacionDetalle() {
    const cards = contenedor.querySelectorAll(".product-card");

    cards.forEach((card) => {
      card.addEventListener("click", (e) => {
        // Si el clic viene del botón de carrito, no navegamos
        if (e.target.closest(".btn-add-cart")) return;

        const id = card.getAttribute("data-product-id");
        if (!id) return;

        window.location.href = `/pages/producto.html?id=${id}`;
      });
    });
  }

  async function cargarDestacados() {
    try {
      const res = await fetch("/productos/destacados");

      if (!res.ok) {
        console.error("No se pudieron cargar los productos destacados.");
        return;
      }

      const data = await res.json();
      console.log("DEBUG destacados:", data);

      contenedor.innerHTML = "";

      if (!Array.isArray(data) || data.length === 0) {
        contenedor.innerHTML = `
          <div class="col-12">
            <p class="text-center text-muted">
              De momento no hay productos destacados.
            </p>
          </div>
        `;
        return;
      }

      data.forEach((entry) => {
        const prod = entry.producto;
        if (!prod) return; // categoría sin productos

        const col = document.createElement("div");
        col.className = "col";

        col.innerHTML = `
          <div class="card shadow-sm border-0 h-100 product-card"
               data-product-id="${prod.id}">
            <img src="${prod.imagen || "https://via.placeholder.com/400x500"}"
                 class="card-img-top"
                 alt="${prod.nombre}">
            <div class="card-body text-center d-flex flex-column">
              <h5 class="fw-bold">${prod.nombre}</h5>
              <p class="text-muted mb-1">${entry.categoria}</p>
              <p class="fw-semibold mb-3">${Number(prod.precio).toFixed(2)} €</p>
              <button class="btn btn-dark w-100 mt-auto btn-add-cart"
                      data-product-id="${prod.id}">
                Agregar al carrito
              </button>
            </div>
          </div>
        `;

        contenedor.appendChild(col);
      });

      // Listeners para "Agregar al carrito"
      const botones = contenedor.querySelectorAll(".btn-add-cart");
      botones.forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation(); // por si acaso, para que no dispare el click de la card

          const productId = btn.getAttribute("data-product-id");

          try {
            const res = await fetch("/api/cart/add", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                productId: productId,
                cantidad: 1,
              }),
            });

            // No logueado → mostramos alerta roja
            if (res.status === 401) {
              showRopaError(
                "Debes iniciar sesión para añadir productos al carrito."
              );
              return;
            }

            const data = await res.json();

            if (!data.success) {
              showRopaError(data.error || "No se pudo añadir al carrito.");
              return;
            }

            const originalText = btn.textContent;
            const originalClasses = btn.className;

            btn.disabled = true;
            btn.textContent = "Añadido correctamente";
            btn.classList.remove("btn-dark");
            btn.classList.add("btn-success");

            setTimeout(() => {
              btn.disabled = false;
              btn.textContent = originalText;
              btn.className = originalClasses;
            }, 2000);
          } catch (err) {
            console.error("Error al añadir desde destacados:", err);
            showRopaError("Ha ocurrido un error al añadir el producto.");
          }
        });
      });

      activarNavegacionDetalle();
    } catch (err) {
      console.error("Error cargando destacados:", err);
      showRopaError("Error al cargar los productos destacados.");
    }
  }

  cargarDestacados();
});
