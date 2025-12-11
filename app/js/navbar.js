(async () => {

    const homeDesktop = document.getElementById('iconHome');
    const userDesktop = document.getElementById('iconUser');
    const cartDesktop = document.getElementById('iconCart');
    const logoutDesktop = document.getElementById('logoutIcon');


    const homeMobile = document.getElementById('iconHomeMobile');
    const userMobile = document.getElementById('iconUserMobile');
    const cartMobile = document.getElementById('iconCartMobile');
    const logoutMobile = document.getElementById('logoutIconMobile');

    const adminItem = document.getElementById('navAdminItem');


    const searchDesktop = document.getElementById('iconSearchDesktop');
    const searchMobile = document.getElementById('iconSearchMobile');

    const searchOverlay = document.getElementById('searchOverlay');
    const searchInput = document.getElementById('searchInput');
    const searchClose = document.getElementById('searchClose');
    const searchResults = document.getElementById('searchResults');
    const searchPopularWrapper = document.getElementById('searchPopularWrapper');



    function onClick(elements, handler) {
        elements
            .filter(Boolean)
            .forEach(el => el.addEventListener('click', handler));
    }


    async function openMiniCart() {
        const modalEl = document.getElementById('miniCartModal');
        const contentEl = document.getElementById('miniCartContent');
        const totalEl = document.getElementById('miniCartTotal');

        if (!modalEl || !contentEl || !totalEl) {
            window.location.href = '/pages/cart.html';
            return;
        }

        contentEl.innerHTML = `
            <p class="text-center text-muted mb-0">Cargando carrito...</p>
        `;
        totalEl.textContent = '0,00 €';

        try {
            const res = await fetch('/api/cart', {
                credentials: 'include'
            });

            if (res.status === 401) {
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
                    <p class="text-center text-muted mb-0">
                        Tu carrito está vacío.
                    </p>
                `;
                totalEl.textContent = '0,00 €';
            } else {
                let html = '<ul class="list-unstyled mb-0">';

                items.forEach(item => {
                    const nombre = item.nombre || 'Producto';
                    const cantidad = item.cantidad || 1;
                    const totalLineaNum = Number(item.total_linea || 0);

                    html += `
                        <li class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <div class="fw-semibold small">${nombre}</div>
                                <div class="text-muted small">x${cantidad}</div>
                            </div>
                            <div class="fw-semibold small">
                                ${isNaN(totalLineaNum) ? '' : totalLineaNum.toFixed(2) + ' €'}
                            </div>
                        </li>
                    `;
                });

                html += '</ul>';
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

        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }


    let searchTimeout = null;

    function openSearchOverlay() {
        if (!searchOverlay) return;
        searchOverlay.classList.add('search-overlay--visible');

        if (searchInput) {
            searchInput.value = "";
            searchInput.focus();
        }

        if (searchResults) {
            searchResults.innerHTML = "";
        }

        if (searchPopularWrapper) {
            searchPopularWrapper.classList.remove("d-none");
        }
    }


    function closeSearchOverlay() {
        if (!searchOverlay) return;
        searchOverlay.classList.remove('search-overlay--visible');
    }

    function renderSearchResults(products, query) {
        if (!searchResults) return;

        if (!query || query.trim().length === 0) {
            searchResults.innerHTML = "";
            return;
        }

        if (!products || products.length === 0) {
            searchResults.innerHTML = `
                <p class="mt-3 text-muted">
                    No se encontraron resultados para "<strong>${query}</strong>".
                </p>
            `;
            return;
        }

        let html = `
            <p class="mt-3">
                Resultados para "<strong>${query}</strong>":
            </p>
            <div class="row g-3 mt-1">
        `;

        products.forEach(p => {
            const img = p.imagen && p.imagen.trim() !== ""
                ? p.imagen
                : "/img/clothes/TH-shirt.jpg";

            const precio = Number(p.precio || 0).toFixed(2);

            html += `
                <div class="col-12 col-sm-6 col-md-4">
                    <div class="card shadow-sm border-0 h-100 search-result-card"
                         data-product-id="${p.id}"
                         style="cursor:pointer;">
                        <img src="${img}" class="card-img-top" alt="${p.nombre}">
                        <div class="card-body text-center d-flex flex-column">
                            <h6 class="fw-bold mb-1">${p.nombre}</h6>
                            <p class="fw-semibold mb-2">${precio} €</p>
                            <button class="btn btn-dark btn-sm mt-auto">
                                Ver detalle
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;

        searchResults.innerHTML = html;

        const cards = searchResults.querySelectorAll(".search-result-card");
        cards.forEach(card => {
            card.addEventListener("click", () => {
                const id = card.getAttribute("data-product-id");
                if (!id) return;
                window.location.href = `/pages/producto.html?id=${id}`;
            });
        });
    }

    async function performSearch(query) {
        const q = query.trim();

        if (!q || q.length === 0) {
            renderSearchResults([], q);

            if (searchPopularWrapper) {
                searchPopularWrapper.classList.remove("d-none");
            }

            return;
        }

        if (searchPopularWrapper) {
            searchPopularWrapper.classList.add("d-none");
        }

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            if (!res.ok) {
                console.error("Error en /api/search");
                renderSearchResults([], q);
                return;
            }

            const data = await res.json();
            if (!data.success) {
                renderSearchResults([], q);
                return;
            }

            renderSearchResults(data.results || [], q);

        } catch (err) {
            console.error("Error realizando búsqueda:", err);
            renderSearchResults([], q);
        }
    }


    function setupSearchOverlay() {
        if (!searchOverlay || !searchInput) return;


        onClick([searchDesktop, searchMobile], (e) => {
            e.preventDefault();
            openSearchOverlay();
        });


        if (searchClose) {
            searchClose.addEventListener("click", (e) => {
                e.preventDefault();
                closeSearchOverlay();
            });
        }


        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                closeSearchOverlay();
            }
        });


        searchInput.addEventListener("input", (e) => {
            const value = e.target.value;

            clearTimeout(searchTimeout);

            searchTimeout = setTimeout(() => {
                performSearch(value);
            }, 300);
        });


        const quickCards = document.querySelectorAll(".search-quick");
        quickCards.forEach(card => {
            card.addEventListener("click", () => {
                const q = card.getAttribute("data-query") || "";
                if (!searchInput) return;

                searchInput.value = q;
                searchInput.focus();
                performSearch(q);
            });
        });
    }


    setupSearchOverlay();

    onClick([homeDesktop, homeMobile], (e) => {
        e.preventDefault();
        window.location.href = '/index.html';
    });

    try {
        const data = await fetchCurrentUser();
        console.log('DEBUG navbar: estado sesión →', data);


        if (!data.autenticado) {

            onClick([userDesktop, userMobile], (e) => {
                e.preventDefault();
                window.location.href = '/pages/login.html';
            });


            onClick([cartDesktop, cartMobile], (e) => {
                e.preventDefault();
                window.location.href = '/pages/login.html';
            });


            [logoutDesktop, logoutMobile].forEach(el => {
                if (el) el.classList.add('d-none');
            });


            if (adminItem) adminItem.classList.add('d-none');

            return;
        }


        onClick([userDesktop, userMobile], (e) => {
            e.preventDefault();
            window.location.href = '/pages/profile.html';
        });


        onClick([cartDesktop, cartMobile], async (e) => {
            e.preventDefault();
            await openMiniCart();
        });


        [logoutDesktop, logoutMobile].forEach(el => {
            if (!el) return;
            el.classList.remove('d-none');
            el.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await logout();
                    window.location.href = '/index.html';
                } catch (err) {
                    console.error('Error al cerrar sesión:', err);
                }
            });
        });


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
