// navbar.js
(async () => {
    // ICONOS DESKTOP
    const homeDesktop   = document.getElementById('iconHome');
    const userDesktop   = document.getElementById('iconUser');
    const cartDesktop   = document.getElementById('iconCart');
    const logoutDesktop = document.getElementById('logoutIcon');

    // ICONOS MÓVIL
    const homeMobile    = document.getElementById('iconHomeMobile');
    const userMobile    = document.getElementById('iconUserMobile');
    const cartMobile    = document.getElementById('iconCartMobile');
    const logoutMobile  = document.getElementById('logoutIconMobile');

    const adminItem     = document.getElementById('navAdminItem');
    const searchDesktop = document.getElementById('iconSearchDesktop');

if (searchDesktop) {
    searchDesktop.addEventListener('click', () => {
        alert("Aquí irá el buscador más adelante :)");
    });
}


    // Pequeña utilidad para asignar el mismo handler a varios elementos
    function onClick(elements, handler) {
        elements
            .filter(Boolean)
            .forEach(el => el.addEventListener('click', handler));
    }

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

            // carrito → login
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

        // carrito → carrito
        onClick([cartDesktop, cartMobile], (e) => {
            e.preventDefault();
            window.location.href = '/pages/cart.html';
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
