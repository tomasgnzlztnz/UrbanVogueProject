
document.addEventListener("DOMContentLoaded", async () => {
    const errorEl = document.getElementById("profileError");
    const successEl = document.getElementById("profileSuccess");

    const inputNombre = document.getElementById("profileNombre");
    const pEmail = document.getElementById("profileEmail");
    const pRol = document.getElementById("profileRole");
    const inputDireccion = document.getElementById("profileDireccion");
    const inputTelefono = document.getElementById("profileTelefono");
    const pFecha = document.getElementById("profileFecha");
    const form = document.getElementById("profileForm");

    const ordersEmptyEl = document.getElementById("ordersEmpty");
    const ordersAccordionEl = document.getElementById("ordersAccordion");

    function showError(msg) {
        if (!errorEl) return;
        errorEl.textContent = msg;
        errorEl.classList.remove("d-none");
    }

    function clearError() {
        if (!errorEl) return;
        errorEl.textContent = "";
        errorEl.classList.add("d-none");
    }

    function showSuccess(msg) {
        if (!successEl) return;
        successEl.textContent = msg;
        successEl.classList.remove("d-none");

        setTimeout(() => {
            successEl.classList.add("d-none");
            successEl.textContent = "";
        }, 3000);
    }

    let originalUser = null;


    async function loadOrders() {
        if (!ordersAccordionEl || !ordersEmptyEl) return;

        try {
            const res = await fetch("/api/user/orders", {
                method: "GET",
                credentials: "include"
            });

            if (res.status === 401) {
                window.location.href = "/pages/login.html";
                return;
            }

            const data = await res.json();
            console.log("DEBUG profile → pedidos:", data);

            if (!data.success) {
                showError(data.message || "No se han podido cargar tus pedidos.");
                return;
            }

            const pedidos = data.pedidos || [];


            if (pedidos.length === 0) {
                ordersEmptyEl.classList.remove("d-none");
                ordersAccordionEl.innerHTML = "";
                return;
            }

            ordersEmptyEl.classList.add("d-none");
            ordersAccordionEl.innerHTML = "";

            pedidos.forEach((pedido, index) => {
                const collapseId = `pedidoCollapse${pedido.id}`;
                const headingId = `pedidoHeading${pedido.id}`;

                const fechaStr = (() => {
                    if (!pedido.fecha) return "";
                    let raw = pedido.fecha;
                    if (typeof raw === "string") raw = raw.replace(" ", "T");
                    const fecha = new Date(raw);
                    if (isNaN(fecha.getTime())) return "";
                    return fecha.toLocaleString("es-ES");
                })();

                const totalNum = Number(pedido.total || 0);
                const estado = pedido.estado || "pendiente";


                let itemsHtml = "";
                (pedido.items || []).forEach(item => {
                    const tallaTxt = item.talla ? ` (Talla ${item.talla})` : "";
                    const subtotalNum = Number(item.subtotal || 0);

                    itemsHtml += `
                        <li class="d-flex justify-content-between align-items-center mb-2">
                            <div class="d-flex align-items-center">
                                ${item.imagen ? `
                                    <img src="${item.imagen}" alt="${item.nombre}"
                                         style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; margin-right: 0.5rem;">
                                ` : ""}
                                <div>
                                    <div class="fw-semibold small">${item.nombre}${tallaTxt}</div>
                                    <div class="text-muted small">
                                        x${item.cantidad} · ${Number(item.precioUnitario).toFixed(2)} €
                                    </div>
                                </div>
                            </div>
                            <div class="fw-semibold small">
                                ${subtotalNum.toFixed(2)} €
                            </div>
                        </li>
                    `;
                });

                const itemHtml = `
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="${headingId}">
                            <button class="accordion-button ${index === 0 ? "" : "collapsed"}" type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#${collapseId}"
                                    aria-expanded="${index === 0 ? "true" : "false"}"
                                    aria-controls="${collapseId}">
                                <div class="d-flex flex-column flex-md-row w-100 justify-content-between">
                                    <span>
                                        Pedido #${pedido.id}
                                        <span class="text-muted small"> · ${fechaStr}</span>
                                    </span>
                                    <span class="small">
                                        Estado: <strong>${estado}</strong> ·
                                        Total: <strong>${totalNum.toFixed(2)} €</strong>
                                    </span>
                                </div>
                            </button>
                        </h2>
                        <div id="${collapseId}" class="accordion-collapse collapse ${index === 0 ? "show" : ""}"
                             aria-labelledby="${headingId}" data-bs-parent="#ordersAccordion">
                            <div class="accordion-body">
                                <ul class="list-unstyled mb-0">
                                    ${itemsHtml}
                                </ul>
                            </div>
                        </div>
                    </div>
                `;

                ordersAccordionEl.insertAdjacentHTML("beforeend", itemHtml);
            });

        } catch (err) {
            console.error("Error cargando pedidos del perfil:", err);
            showError("Ha ocurrido un error al cargar tus pedidos.");
        }
    }


    try {
        const data = await fetchCurrentUser();

        console.log("DEBUG profile → usuario:", data);

        if (!data.autenticado || !data.usuario) {
            window.location.href = "/pages/login.html";
            return;
        }

        const user = data.usuario;


        originalUser = {
            nombre: user.nombre || "",
            direccion: user.direccion || "",
            telefono: user.telefono || ""
        };

        if (inputNombre) inputNombre.value = originalUser.nombre;
        if (pEmail) pEmail.textContent = user.email || "";
        if (pRol) pRol.textContent = user.rol || "";
        if (inputDireccion) inputDireccion.value = originalUser.direccion;
        if (inputTelefono) inputTelefono.value = originalUser.telefono;
        if (pFecha && user.fecha_registro) {
            let raw = user.fecha_registro;
            if (typeof raw === "string") raw = raw.replace(" ", "T");
            const fecha = new Date(raw);
            fechaNueva = raw.split("T")
            if (!isNaN(fecha.getTime())) {
                pFecha.textContent = fechaNueva[0];
            }
            console.log("FECHA:::::::", fechaNueva[0]);
        }

    } catch (err) {
        console.error("Error cargando perfil:", err);
        showError("No se han podido cargar los datos de tu perfil.");
        return;
    }

    await loadOrders();


    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            clearError();

            const nombre = inputNombre ? inputNombre.value.trim() : "";
            const direccion = inputDireccion ? inputDireccion.value.trim() : "";
            const telefono = inputTelefono ? inputTelefono.value.trim() : "";


            if (!nombre) {
                showError("El nombre no puede estar vacío.");
                return;
            }

            if (!originalUser) {
                showError("No se han podido validar los cambios del perfil.");
                return;
            }


            const hasChanges =
                nombre !== originalUser.nombre ||
                direccion !== originalUser.direccion ||
                telefono !== originalUser.telefono;

            if (!hasChanges) {
                showError("No has modificado ningún dato.");
                return;
            }

            try {
                const res = await fetch("/api/user/me", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        nombre,
                        direccion,
                        telefono
                    })
                });

                if (res.status === 401) {
                    window.location.href = "/pages/login.html";
                    return;
                }

                const data = await res.json();
                console.log("DEBUG update profile:", data);

                if (!data.success) {
                    showError(data.message || "No se pudieron guardar los cambios.");
                    return;
                }


                originalUser = { nombre, direccion, telefono };

                showSuccess("Perfil actualizado correctamente.");

            } catch (err) {
                console.error("Error al actualizar perfil:", err);
                showError("Ha ocurrido un error al actualizar tu perfil.");
            }
        });
    }
});
