const API_URL = '/api';


async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },

            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();


        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Error al iniciar sesión');
        }

        return data;
    } catch (err) {
        console.error('Error en login():', err);
        throw err;
    }
}


async function fetchCurrentUser() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();


        return data;
    } catch (err) {
        console.error('Error en fetchCurrentUser():', err);
        return {
            autenticado: false,
            usuario: null
        };
    }
}


async function logout() {
    try {
        const response = await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        const data = await response.json();
        return data;
    } catch (err) {
        console.error('Error en logout():', err);
        throw err;
    }
}

