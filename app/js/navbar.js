(async () => {
    const userIcon  = document.getElementById('iconUser');
    const cartIcon  = document.getElementById('iconCart');
    const logoutEl  = document.getElementById('btnLogout');
    const adminItem = document.getElementById('navAdminItem');

    if (!userIcon || !cartIcon) {
        console.error('No se encontraron los iconos de navbar');
        return;
    }

    try {
        const data = await fetchCurrentUser(); // { autenticado, usuario }
        console.log('DEBUG navbar: estado sesión →', data);

        // ESCENARIO 1: NO LOGUEADO
        if (!data.autenticado) {
            // icono usuario → login
            userIcon.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/pages/login.html';
            });

            // icono carrito → login también
            cartIcon.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/pages/login.html';
            });

            // ocultar logout
            if (logoutEl) logoutEl.classList.add('d-none');

            // ocultar admin
            if (adminItem) adminItem.classList.add('d-none');

            return; // terminamos aquí para invitados
        }

        // ESCENARIO 2: LOGUEADO (CLIENTE O ADMIN)

        // icono usuario → perfil
        userIcon.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/pages/profile.html';
        });

        // icono carrito → carrito
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/pages/cart.html';
        });

        // mostrar botón de logout
        if (logoutEl) {
            logoutEl.classList.remove('d-none');
            logoutEl.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await logout(); // función de auth.js
                    window.location.href = '/index.html'; // vuelve como invitado
                } catch (err) {
                    console.error('Error al cerrar sesión:', err);
                }
            });
        }

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
