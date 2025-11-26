// navbar.js
(async () => {
    // ICONOS DESKTOP
    const homeDesktop = document.getElementById('iconHome');
    const userDesktop = document.getElementById('iconUser');
    const cartDesktop = document.getElementById('iconCart');
    const logoutDesktop = document.getElementById('logoutIcon');

    // ICONOS MÓVIL
    const homeMobile = document.getElementById('iconHomeMobile');
    const userMobile = document.getElementById('iconUserMobile');
    const cartMobile = document.getElementById('iconCartMobile');
    const logoutMobile = document.getElementById('logoutIconMobile');

    const adminItem = document.getElementById('navAdminItem');
    const searchDesktop = document.getElementById('iconSearchDesktop'); // de momento sin funcionalidad

    // Utilidad para asignar el mismo handler a varios elementos
    function onClick(elements, handler) {
        elements
            .filter(Boolean)
            .forEach(el => el.addEventListener('click', handler));
    }

    // 🔹 Mini-carrito tipo dropdown (global: desktop + móvil)
    async function toggleMiniCartDropdown() {
        const dropdown = document.getElementById('miniCartDropdown');
        const contentEl = document.getElementById('miniCartContent');
        const totalEl = document.getElementById('miniCartTotal');

        if (!dropdown || !contentEl || !totalEl) {
            // Si falta algo, fallback al carrito normal
            window.location.href = '/pages/cart.html';
            return;
        }

        // Toggle visible / oculto
        const isHidden = dropdown.classList.contains('d-none');
        if (isHidden) {
            dropdown.classList.remove('d-none');
        } else {
            dropdown.classList.add('d-none');
            return;
        }

        // Estado de "cargando"
        contentEl.innerHTML = `
            <p class="text-center text-muted mb-0">Cargando carrito...</p>
        `;
        totalEl.textContent = '0,00 €';

        try {
            const res = await fetch('/api/cart', {
                credentials: 'include'
            });

            if (res.status === 401) {
                // Sesión caducada → al login
                window.location.href = '/pages/login.html';
                return;
            }

            if (!res.ok) {
                throw new Error('Error al obtener el carrito');
            }

            const data = await res.json();
            const items = data.items || [];
            const total = Number(data.total || 0);

            if (items.length === 0) {
                contentEl.innerHTML = `
                    <p class="text-center text-muted mb-0">Tu carrito está vacío.</p>
                `;
                totalEl.textContent = '0,00 €';
            } else {
                let html = '';

                items.forEach(item => {
                    const nombre = item.nombre || 'Producto';
                    const cantidad = item.cantidad || 1;
                    const totalLineaNum = Number(item.total_linea || 0);
                    const totalLineaTxt = isNaN(totalLineaNum)
                        ? ''
                        : totalLineaNum.toFixed(2) + ' €';

                    // Si en /api/cart no llega imagen, usamos una por defecto
                    const imgSrc = item.imagen && String(item.imagen).trim() !== ''
                        ? item.imagen
                        : '/img/clothes/TH-shirt.jpg';

                    html += `
                        <div class="mini-cart-item">
                            <img src="${imgSrc}" alt="${nombre}">
                            <div>
                                <div class="mini-cart-item-name">${nombre}</div>
                                <div class="mini-cart-item-qty">x${cantidad}</div>
                            </div>
                            <div class="ms-auto small fw-semibold">
                                ${totalLineaTxt}
                            </div>
                        </div>
                    `;
                });

                contentEl.innerHTML = html;
                totalEl.textContent = `${total.toFixed(2)} €`;
            }

        } catch (err) {
            console.error('Error cargando mini carrito:', err);
            contentEl.innerHTML = `
                <p class="text-center text-danger mb-0">
                    Error al cargar el carrito.
                </p>
            `;
        }
    }

    // Cerrar dropdown si se hace click fuera
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('miniCartDropdown');
        const cartIconDesktop = document.getElementById('iconCart');
        const cartIconMobile = document.getElementById('iconCartMobile');

        if (!dropdown) return;
        if (dropdown.classList.contains('d-none')) return;

        const clickInsideDropdown = dropdown.contains(e.target);
        const clickOnCartDesktop = cartIconDesktop && cartIconDesktop.contains(e.target);
        const clickOnCartMobile = cartIconMobile && cartIconMobile.contains(e.target);

        if (!clickInsideDropdown && !clickOnCartDesktop && !clickOnCartMobile) {
            dropdown.classList.add('d-none');
        }
    });

    // HOME → siempre lleva al inicio
    onClick([homeDesktop, homeMobile], (e) => {
        e.preventDefault();
        window.location.href = '/index.html';
    });

    try {
        const data = await fetchCurrentUser(); // { autenticado, usuario }
        console.log('DEBUG navbar: estado sesión →', data);

        // ESCENARIO 1: NO LOGUEADO
        if (!data.autenticado) {
            // usuario → login
            onClick([userDesktop, userMobile], (e) => {
                e.preventDefault();
                window.location.href = '/pages/login.html';
            });

            // carrito → login (desktop y móvil)
            onClick([cartDesktop, cartMobile], (e) => {
                e.preventDefault();
                window.location.href = '/pages/login.html';
            });

            // ocultar logout
            [logoutDesktop, logoutMobile].forEach(el => {
                if (el) el.classList.add('d-none');
            });

            // ocultar admin
            if (adminItem) adminItem.classList.add('d-none');

            return;
        }

        // ESCENARIO 2: LOGUEADO (CLIENTE O ADMIN)

        // usuario → perfil
        onClick([userDesktop, userMobile], (e) => {
            e.preventDefault();
            window.location.href = '/pages/profile.html';
        });

        // carrito desktop y móvil → mini-carrito dropdown
        onClick([cartDesktop, cartMobile], async (e) => {
            e.preventDefault();
            await toggleMiniCartDropdown();
        });

        // mostrar logout
        [logoutDesktop, logoutMobile].forEach(el => {
            if (!el) return;
            el.classList.remove('d-none');
            el.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await logout();  // función de auth.js
                    window.location.href = '/index.html';
                } catch (err) {
                    console.error('Error al cerrar sesión:', err);
                }
            });
        });

        // ESCENARIO 3: ADMIN
        if (adminItem) {
            if (data.usuario && data.usuario.rol === 'admin') {
                adminItem.classList.remove('d-none');
            } else {
                adminItem.classList.add('d-none');
            }
        }

    } catch (err) {
        console.error('Error en navbar.js:', err);
    }
})();
