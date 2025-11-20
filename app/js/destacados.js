// app/js/destacados.js

document.addEventListener("DOMContentLoaded", () => {
  const contenedor = document.getElementById("destacadosContainer");
  if (!contenedor) return;

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
          <div class="card shadow-sm border-0 h-100">
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
        btn.addEventListener("click", async () => {
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

            if (res.status === 401) {
              alert(
                "Debes iniciar sesión para añadir productos al carrito."
              );
              window.location.href = "/pages/login.html";
              return;
            }

            const data = await res.json();

            if (!data.success) {
              alert(data.error || "No se pudo añadir al carrito.");
              return;
            }

            alert("Producto añadido al carrito ✅");
          } catch (err) {
            console.error("Error al añadir desde destacados:", err);
            alert("Error al añadir al carrito.");
          }
        });
      });
    } catch (err) {
      console.error("Error cargando destacados:", err);
    }
  }

  cargarDestacados();
});
