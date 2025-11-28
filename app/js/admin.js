// app/js/admin.js

document.addEventListener("DOMContentLoaded", async () => {
    const adminError = document.getElementById("adminError");
    const adminSuccess = document.getElementById("adminSuccess");

    // Elementos del panel de categorías
    const catForm = document.getElementById("categoriaForm");
    const catIdInput = document.getElementById("categoriaId");
    const catNombreInput = document.getElementById("categoriaNombre");
    const catDescInput = document.getElementById("categoriaDescripcion");
    const catFormTitle = document.getElementById("catFormTitle");
    const btnCancelarEd = document.getElementById("btnCancelarEdicion");

    const catTableBody = document.getElementById("categoriasTableBody");
    const catEmptyText = document.getElementById("categoriasVacio");

    // Elementos del panel de PRODUCTOS
    const prodForm = document.getElementById("productoForm");
    const prodIdInput = document.getElementById("productoId");
    const prodNombreInput = document.getElementById("productoNombre");
    const prodDescInput = document.getElementById("productoDescripcion");
    const prodPrecioInput = document.getElementById("productoPrecio");
    const prodStockInput = document.getElementById("productoStock");
    const prodTallaInput = document.getElementById("productoTalla");
    const prodColorInput = document.getElementById("productoColor");
    const prodImagenInput = document.getElementById("productoImagen");
    const prodCategoriaSelect = document.getElementById("productoCategoria");
    const prodFormTitle = document.getElementById("prodFormTitle");
    const btnCancelarProdEd = document.getElementById("btnCancelarEdicionProducto");

    const prodTableBody = document.getElementById("productosTableBody");
    const prodEmptyText = document.getElementById("productosVacio");

    // Elementos del panel de USUARIOS
    const usersTableBody = document.getElementById("usuariosTableBody");
    const usersEmptyText = document.getElementById("usuariosVacio");



    // ========================================
    // Utils de mensajes
    // ========================================
    function showAdminError(msg) {
        if (!adminError) return;
        adminError.textContent = msg;
        adminError.classList.remove("d-none");
    }

    function clearAdminError() {
        if (!adminError) return;
        adminError.textContent = "";
        adminError.classList.add("d-none");
    }

    function showAdminSuccess(msg) {
        if (!adminSuccess) return;
        adminSuccess.textContent = msg;
        adminSuccess.classList.remove("d-none");

        setTimeout(() => {
            adminSuccess.classList.add("d-none");
            adminSuccess.textContent = "";
        }, 2500);
    }

    // ========================================
    // 1. Comprobar que el usuario es admin
    // ========================================
    try {
        const data = await fetchCurrentUser(); // de auth.js
        console.log("DEBUG admin → usuario:", data);

        if (!data.autenticado || !data.usuario) {
            window.location.href = "/pages/login.html";
            return;
        }

        if (data.usuario.rol !== "admin") {
            // si no es admin, lo mandamos al home
            window.location.href = "/index.html";
            return;
        }
    } catch (err) {
        console.error("Error comprobando usuario admin:", err);
        showAdminError("No se ha podido verificar el usuario administrador.");
        return;
    }

    // ========================================
    // 2. Funciones de CATEGORÍAS
    // ========================================

    async function cargarCategorias() {
        clearAdminError();

        try {
            const res = await fetch("/api/admin/categorias", {
                method: "GET",
                credentials: "include"
            });

            if (res.status === 401) {
                window.location.href = "/pages/login.html";
                return;
            } else if (res.status === 403) {
                window.location.href = "/index.html";
                return;
            }

            const data = await res.json();
            console.log("DEBUG admin → categorias:", data);

            if (!data.success) {
                showAdminError(data.message || "No se pudieron cargar las categorías.");
                return;
            }

            const categorias = data.categorias || [];

            if (categorias.length === 0) {
                if (catEmptyText) catEmptyText.classList.remove("d-none");
                if (catTableBody) catTableBody.innerHTML = "";
                return;
            }

            if (catEmptyText) catEmptyText.classList.add("d-none");

            if (catTableBody) {
                catTableBody.innerHTML = "";

                categorias.forEach(cat => {
                    const tr = document.createElement("tr");

                    tr.innerHTML = `
                        <td>${cat.id}</td>
                        <td>${cat.nombre}</td>
                        <td>${cat.descripcion || ""}</td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-outline-primary me-2 btn-cat-edit"
                                    data-cat-id="${cat.id}"
                                    data-cat-nombre="${encodeURIComponent(cat.nombre)}"
                                    data-cat-descripcion="${encodeURIComponent(cat.descripcion || "")}">
                                Editar
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-cat-delete"
                                    data-cat-id="${cat.id}">
                                Eliminar
                            </button>
                        </td>
                    `;

                    catTableBody.appendChild(tr);
                });

                // Añadir eventos a botones de editar
                const editButtons = catTableBody.querySelectorAll(".btn-cat-edit");
                editButtons.forEach(btn => {
                    btn.addEventListener("click", () => {
                        const id = btn.getAttribute("data-cat-id");
                        const nom = decodeURIComponent(btn.getAttribute("data-cat-nombre") || "");
                        const desc = decodeURIComponent(btn.getAttribute("data-cat-descripcion") || "");

                        activarEdicionCategoria(id, nom, desc);
                    });
                });

                // Añadir eventos a botones de eliminar
                const deleteButtons = catTableBody.querySelectorAll(".btn-cat-delete");
                deleteButtons.forEach(btn => {
                    btn.addEventListener("click", () => {
                        const id = btn.getAttribute("data-cat-id");
                        eliminarCategoria(id);
                    });
                });
            }

        } catch (err) {
            console.error("Error al cargar categorías:", err);
            showAdminError("Error al cargar las categorías.");
        }
    }

    function activarEdicionCategoria(id, nombre, descripcion) {
        if (!catIdInput || !catNombreInput || !catDescInput || !catFormTitle || !btnCancelarEd) return;

        catIdInput.value = id;
        catNombreInput.value = nombre;
        catDescInput.value = descripcion;

        catFormTitle.textContent = "Editar categoría";
        btnCancelarEd.classList.remove("d-none");
    }

    function resetFormularioCategoria() {
        if (!catIdInput || !catNombreInput || !catDescInput || !catFormTitle || !btnCancelarEd) return;

        catIdInput.value = "";
        catNombreInput.value = "";
        catDescInput.value = "";
        catFormTitle.textContent = "Crear nueva categoría";
        btnCancelarEd.classList.add("d-none");
    }

    async function guardarCategoria(e) {
        e.preventDefault();
        clearAdminError();

        if (!catNombreInput || !catDescInput) return;

        const id = catIdInput ? catIdInput.value : "";
        const nombre = catNombreInput.value.trim();
        const descripcion = catDescInput.value.trim();

        if (!nombre) {
            showAdminError("El nombre de la categoría es obligatorio.");
            return;
        }

        let url = "/api/admin/categorias";
        let method = "POST";

        if (id) {
            url = `/api/admin/categorias/${id}`;
            method = "PUT";
        }

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ nombre, descripcion })
            });

            if (res.status === 401) {
                window.location.href = "/pages/login.html";
                return;
            } else if (res.status === 403) {
                window.location.href = "/index.html";
                return;
            }

            const data = await res.json();
            console.log("DEBUG admin → guardarCategoria:", data);

            if (!data.success) {
                showAdminError(data.message || "No se pudo guardar la categoría.");
                return;
            }

            showAdminSuccess(id ? "Categoría actualizada." : "Categoría creada.");
            resetFormularioCategoria();

            // Recargar lista de categorías del panel de categorías
            await cargarCategorias();

            // Y también recargar el <select> de categorías en PRODUCTOS
            await cargarCategoriasEnSelectProductos();

        } catch (err) {
            console.error("Error al guardar categoría:", err);
            showAdminError("Error al guardar la categoría.");
        }
    }

    async function eliminarCategoria(id) {
        if (!id) return;

        clearAdminError();

        try {
            const res = await fetch(`/api/admin/categorias/${id}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (res.status === 401) {
                window.location.href = "/pages/login.html";
                return;
            } else if (res.status === 403) {
                window.location.href = "/index.html";
                return;
            }

            const data = await res.json();
            console.log("DEBUG admin → eliminarCategoria:", data);

            if (!data.success) {
                showAdminError(data.message || "No se pudo eliminar la categoría.");
                return;
            }

            // ✅ Mensaje de confirmación justo debajo de los paneles
            showAdminSuccess("Categoría eliminada correctamente.");

            // Refrescar tabla de categorías
            await cargarCategorias();

            // 🔁 Refrescar <select> de categorías en productos
            await cargarCategoriasEnSelectProductos();

        } catch (err) {
            console.error("Error al eliminar categoría:", err);
            showAdminError("Error al eliminar la categoría.");
        }
    }

    // ========================================
    // 3. PRODUCTOS - helpers
    // ========================================

    function validateProductForm(nombre, precio, stock, categoria) {
        let ok = true;

        // Limpia clase de error previa
        document.getElementById("productoNombre").classList.remove("is-invalid");
        document.getElementById("productoPrecio").classList.remove("is-invalid");
        document.getElementById("productoStock").classList.remove("is-invalid");
        document.getElementById("productoCategoria").classList.remove("is-invalid");

        // Validar nombre
        if (!nombre || nombre.trim().length < 2) {
            document.getElementById("productoNombre").classList.add("is-invalid");
            ok = false;
        }

        // Validar precio
        if (isNaN(precio) || precio <= 0) {
            document.getElementById("productoPrecio").classList.add("is-invalid");
            ok = false;
        }

        // Validar stock
        if (isNaN(stock) || stock < 0) {
            document.getElementById("productoStock").classList.add("is-invalid");
            ok = false;
        }

        // Validar categoría
        if (!categoria) {
            document.getElementById("productoCategoria").classList.add("is-invalid");
            ok = false;
        }

        return ok;
    }

    // Rellena el <select> de categorías del formulario de productos
    async function cargarCategoriasEnSelectProductos() {
        if (!prodCategoriaSelect) return;

        try {
            const res = await fetch("/api/admin/categorias", {
                method: "GET",
                credentials: "include"
            });

            if (!res.ok) return;

            const data = await res.json();
            const categorias = data.categorias || [];

            prodCategoriaSelect.innerHTML = "";

            // Opción "sin categoría"
            const optDefault = document.createElement("option");
            optDefault.value = "";
            optDefault.textContent = "Sin categoría";
            prodCategoriaSelect.appendChild(optDefault);

            categorias.forEach(cat => {
                const opt = document.createElement("option");
                opt.value = cat.id;
                opt.textContent = cat.nombre;
                prodCategoriaSelect.appendChild(opt);
            });

        } catch (err) {
            console.error("Error cargando categorías en select de productos:", err);
        }
    }

    async function cargarProductos() {
        clearAdminError();

        if (!prodTableBody || !prodEmptyText) return;

        try {
            const res = await fetch("/api/admin/productos", {
                method: "GET",
                credentials: "include"
            });

            if (res.status === 401) {
                window.location.href = "/pages/login.html";
                return;
            } else if (res.status === 403) {
                window.location.href = "/index.html";
                return;
            }

            const data = await res.json();
            console.log("DEBUG admin → productos:", data);

            if (!data.success) {
                showAdminError(data.message || "No se pudieron cargar los productos.");
                return;
            }

            const productos = data.productos || [];

            if (productos.length === 0) {
                prodEmptyText.classList.remove("d-none");
                prodTableBody.innerHTML = "";
                return;
            }

            prodEmptyText.classList.add("d-none");
            prodTableBody.innerHTML = "";

            productos.forEach(p => {
                const tr = document.createElement("tr");
                //<td>${p.stock}</td>
                tr.innerHTML = `
                    <td>${p.id}</td>
                    <td>${p.nombre}</td>
                    <td>${Number(p.precio).toFixed(2)} €</td>
                    <td>
                        <div class="btn-group btn-group-sm" role="group">
                            <button class="btn btn-outline-danger btn-stock-dec" data-id="${p.id}">–</button>
                            <span class="px-2">${p.stock}</span>
                            <button class="btn btn-outline-success btn-stock-inc" data-id="${p.id}">+</button>
                        </div>
                    </td>
                    <td>${p.categoria_nombre || "Sin categoría"}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary me-2 btn-prod-edit"
                                data-prod-id="${p.id}">
                            Editar
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-prod-delete"
                                data-prod-id="${p.id}">
                            Eliminar
                        </button>
                    </td>
                `;

                prodTableBody.appendChild(tr);
            });

            // 🔽 Después de pintar la tabla, asignamos eventos a + y -
            const incButtons = prodTableBody.querySelectorAll(".btn-stock-inc");
            incButtons.forEach(btn => {
                btn.addEventListener("click", async () => {
                    const id = btn.getAttribute("data-id");
                    try {
                        await fetch(`/api/admin/productos/${id}/increment`, {
                            method: "POST",
                            credentials: "include"
                        });
                        await cargarProductos(); // recargar lista
                    } catch (err) {
                        console.error("Error incrementando stock:", err);
                        showAdminError("Error al incrementar stock.");
                    }
                });
            });

            const decButtons = prodTableBody.querySelectorAll(".btn-stock-dec");
            decButtons.forEach(btn => {
                btn.addEventListener("click", async () => {
                    const id = btn.getAttribute("data-id");
                    try {
                        await fetch(`/api/admin/productos/${id}/decrement`, {
                            method: "POST",
                            credentials: "include"
                        });
                        await cargarProductos(); // recargar lista
                    } catch (err) {
                        console.error("Error decrementando stock:", err);
                        showAdminError("Error al decrementar stock.");
                    }
                });
            });




            // Botones de editar
            const editButtons = prodTableBody.querySelectorAll(".btn-prod-edit");
            editButtons.forEach(btn => {
                btn.addEventListener("click", () => {
                    const id = btn.getAttribute("data-prod-id");
                    const producto = (data.productos || []).find(p => String(p.id) === String(id));
                    if (producto) activarEdicionProducto(producto);
                });
            });

            // Botones de eliminar
            const deleteButtons = prodTableBody.querySelectorAll(".btn-prod-delete");
            deleteButtons.forEach(btn => {
                btn.addEventListener("click", () => {
                    const id = btn.getAttribute("data-prod-id");
                    eliminarProducto(id);
                });
            });

        } catch (err) {
            console.error("Error al cargar productos:", err);
            showAdminError("Error al cargar los productos.");
        }
    }

    function activarEdicionProducto(p) {
        if (!prodIdInput || !prodNombreInput || !prodDescInput || !prodPrecioInput ||
            !prodStockInput || !prodTallaInput || !prodColorInput || !prodImagenInput ||
            !prodCategoriaSelect || !prodFormTitle || !btnCancelarProdEd) return;

        prodIdInput.value = p.id;
        prodNombreInput.value = p.nombre || "";
        prodDescInput.value = p.descripcion || "";
        prodPrecioInput.value = p.precio || "";
        prodStockInput.value = p.stock || 0;
        prodTallaInput.value = p.talla || "";
        prodColorInput.value = p.color || "";
        prodImagenInput.value = p.imagen || "";
        prodCategoriaSelect.value = p.id_categoria || "";

        prodFormTitle.textContent = "Editar producto";
        btnCancelarProdEd.classList.remove("d-none");
    }

    function resetFormularioProducto() {
        if (!prodIdInput || !prodNombreInput || !prodDescInput || !prodPrecioInput ||
            !prodStockInput || !prodTallaInput || !prodColorInput || !prodImagenInput ||
            !prodCategoriaSelect || !prodFormTitle || !btnCancelarProdEd) return;

        prodIdInput.value = "";
        prodNombreInput.value = "";
        prodDescInput.value = "";
        prodPrecioInput.value = "";
        prodStockInput.value = "0";
        prodTallaInput.value = "";
        prodColorInput.value = "";
        prodImagenInput.value = "";
        prodCategoriaSelect.value = "";

        prodFormTitle.textContent = "Crear nuevo producto";
        btnCancelarProdEd.classList.add("d-none");
    }

    async function guardarProducto(e) {
        e.preventDefault();
        clearAdminError();

        if (!prodNombreInput || !prodPrecioInput) return;

        const id = prodIdInput ? prodIdInput.value : "";
        const nombre = prodNombreInput.value.trim();
        const descripcion = prodDescInput ? prodDescInput.value.trim() : "";
        const precioStr = prodPrecioInput.value;
        const stockStr = prodStockInput ? prodStockInput.value : "0";
        const talla = prodTallaInput ? prodTallaInput.value.trim() : "";
        const color = prodColorInput ? prodColorInput.value.trim() : "";
        const imagen = prodImagenInput ? prodImagenInput.value.trim() : "";
        const id_categoria = prodCategoriaSelect ? prodCategoriaSelect.value : "";

        const precioNum = parseFloat(precioStr);
        const stockNum = parseInt(stockStr);

        // 🛑 Validación front con la función nueva
        const ok = validateProductForm(nombre, precioNum, stockNum, id_categoria);
        if (!ok) {
            showAdminError("Revisa los campos marcados en rojo.");
            return;
        }

        let url = "/api/admin/productos";
        let method = "POST";

        if (id) {
            url = `/api/admin/productos/${id}`;
            method = "PUT";
        }

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    nombre,
                    descripcion,
                    precio: precioNum,
                    stock: stockNum,
                    talla,
                    color,
                    imagen,
                    id_categoria: id_categoria || null
                })
            });

            if (res.status === 401) {
                window.location.href = "/pages/login.html";
                return;
            } else if (res.status === 403) {
                window.location.href = "/index.html";
                return;
            }

            const data = await res.json();
            console.log("DEBUG admin → guardarProducto:", data);

            if (!data.success) {
                showAdminError(data.message || "No se pudo guardar el producto.");
                return;
            }

            showAdminSuccess(id ? "Producto actualizado." : "Producto creado.");

            resetFormularioProducto();
            await cargarProductos();

        } catch (err) {
            console.error("Error al guardar producto:", err);
            showAdminError("Error al guardar el producto.");
        }
    }


    async function eliminarProducto(id) {
        if (!id) return;

        clearAdminError();

        try {
            const res = await fetch(`/api/admin/productos/${id}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (res.status === 401) {
                window.location.href = "/pages/login.html";
                return;
            } else if (res.status === 403) {
                window.location.href = "/index.html";
                return;
            }

            const data = await res.json();
            console.log("DEBUG admin → eliminarProducto:", data);

            if (!data.success) {
                showAdminError(data.message || "No se pudo eliminar el producto.");
                return;
            }

            showAdminSuccess("Producto eliminado correctamente.");
            await cargarProductos();

        } catch (err) {
            console.error("Error al eliminar producto:", err);
            showAdminError("Error al eliminar el producto.");
        }
    }

    // ========================================
    // 4. USUARIOS
    // ========================================

    async function cargarUsuarios() {
        if (!usersTableBody || !usersEmptyText) return;

        try {
            const res = await fetch("/api/admin/usuarios", {
                method: "GET",
                credentials: "include"
            });

            if (res.status === 401) {
                window.location.href = "/pages/login.html";
                return;
            } else if (res.status === 403) {
                window.location.href = "/index.html";
                return;
            }

            const data = await res.json();
            console.log("DEBUG admin → usuarios:", data);

            if (!data.success) {
                showAdminError(data.message || "No se pudieron cargar los usuarios.");
                return;
            }

            const usuarios = data.usuarios || [];

            if (usuarios.length === 0) {
                usersEmptyText.classList.remove("d-none");
                usersTableBody.innerHTML = "";
                return;
            }

            usersEmptyText.classList.add("d-none");
            usersTableBody.innerHTML = "";

            usuarios.forEach(u => {
                const tr = document.createElement("tr");

                const fecha = u.fecha_registro
                    ? new Date(u.fecha_registro).toLocaleString()
                    : "";

                const esAdmin = (u.rol === "admin");
                const nuevoRol = esAdmin ? "cliente" : "admin";
                const textoBoton = esAdmin ? "Hacer cliente" : "Hacer admin";
                const claseBoton = esAdmin ? "btn-outline-secondary" : "btn-outline-primary";

                tr.innerHTML = `
                    <td>${u.id}</td>
                    <td>${u.nombre}</td>
                    <td>${u.email}</td>
                    <td>${u.rol}</td>
                    <td>${fecha}</td>
                    <td class="text-end">
                        <button class="btn btn-sm ${claseBoton} btn-user-rol"
                                data-user-id="${u.id}"
                                data-new-rol="${nuevoRol}">
                            ${textoBoton}
                        </button>
                    </td>
                `;

                usersTableBody.appendChild(tr);
            });

            // Añadir eventos a los botones de cambio de rol
            const roleButtons = usersTableBody.querySelectorAll(".btn-user-rol");
            roleButtons.forEach(btn => {
                btn.addEventListener("click", async () => {
                    const id = btn.getAttribute("data-user-id");
                    const newRol = btn.getAttribute("data-new-rol");
                    await cambiarRolUsuario(id, newRol);
                });
            });

        } catch (err) {
            console.error("Error al cargar usuarios:", err);
            showAdminError("Error al cargar la lista de usuarios.");
        }
    }

    async function cambiarRolUsuario(id, newRol) {
        clearAdminError();

        try {
            const res = await fetch(`/api/admin/usuarios/${id}/rol`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ rol: newRol })
            });

            if (res.status === 401) {
                window.location.href = "/pages/login.html";
                return;
            } else if (res.status === 403) {
                window.location.href = "/index.html";
                return;
            }

            const data = await res.json();
            console.log("DEBUG admin → cambiarRolUsuario:", data);

            if (!data.success) {
                showAdminError(data.message || "No se pudo cambiar el rol.");
                return;
            }

            showAdminSuccess(data.message || "Rol actualizado correctamente.");
            if (newRol == "cliente") {
                console.log("Has degradado al usuario con:", id, "a rol:", newRol);
                window.location.href = "/pages/login.html";
            }
            await cargarUsuarios();

        } catch (err) {
            console.error("Error cambiando rol de usuario:", err);
            showAdminError("Error al cambiar el rol de usuario.");
        }
    }

    // ==============================
    //   NEWSLETTER – LISTADO
    // ==============================
    async function cargarSuscriptores() {
        const tbody = document.getElementById("newsletterTableBody");
        const vacio = document.getElementById("newsletterVacio");
        if (!tbody) return;

        try {
            const res = await fetch("/api/admin/newsletter/list", {
                credentials: "include"
            });

            const text = await res.text();          // <<--- obtenemos texto crudo
            console.log("RAW NEWSLETTER RESPONSE:", text);

            let data;
            try {
                data = JSON.parse(text);            // <<--- Intentamos parsear JSON
            } catch (err) {
                console.error("❗La respuesta NO es JSON válido:", err);
                tbody.innerHTML = "";
                vacio.classList.remove("d-none");
                return;
            }

            if (!data.success) {
                tbody.innerHTML = "";
                vacio.classList.remove("d-none");
                return;
            }

            const lista = data.suscriptores;

            tbody.innerHTML = "";

            if (lista.length === 0) {
                vacio.classList.remove("d-none");
                return;
            }

            vacio.classList.add("d-none");

            lista.forEach(sub => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                <td>${sub.id}</td>
                <td>${sub.email}</td>
                <td>${new Date(sub.fecha_suscripcion).toLocaleString("es-ES")}</td>
            `;
                tbody.appendChild(tr);
            });

        } catch (err) {
            console.error("Error cargando newsletter:", err);
            tbody.innerHTML = "";
            vacio.classList.remove("d-none");
        }
    }





    // ========================================
    // Listeners
    // ========================================

    if (catForm) {
        catForm.addEventListener("submit", guardarCategoria);
    }

    if (btnCancelarEd) {
        btnCancelarEd.addEventListener("click", () => {
            resetFormularioCategoria();
        });
    }

    // Cargar categorías al entrar en la página
    await cargarCategorias();



    // PRODUCTOS - listeners
    if (prodForm) {
        prodForm.addEventListener("submit", guardarProducto);
    }

    if (btnCancelarProdEd) {
        btnCancelarProdEd.addEventListener("click", () => {
            resetFormularioProducto();
        });
    }

    // Cargar categorías en el select de productos y la tabla de productos
    await cargarCategoriasEnSelectProductos();
    await cargarProductos();
    // Cargar usuarios en el panel de usuarios
    await cargarUsuarios();
    await cargarSuscriptores();


});
