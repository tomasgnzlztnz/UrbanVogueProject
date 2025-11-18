// Punto base de tu API
const API_URL = '/api';


// Login: llama a POST /api/auth/login
async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // MUY IMPORTANTE para que se envíen/reciban cookies de sesión
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        // Si la respuesta no es 2xx, lanzamos error
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Error al iniciar sesión');
        }

        return data; // { success, message, usuario }
    } catch (err) {
        console.error('Error en login():', err);
        throw err;
    }
}

// Obtener usuario actual: GET /api/auth/me
async function fetchCurrentUser() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        // data = { autenticado: true/false, usuario: { ... } || null }

        return data;
    } catch (err) {
        console.error('Error en fetchCurrentUser():', err);
        return {
            autenticado: false,
            usuario: null
        };
    }
}

// Logout: POST /api/auth/logout
async function logout() {
    try {
        const response = await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        const data = await response.json();
        return data; // { success, message }
    } catch (err) {
        console.error('Error en logout():', err);
        throw err;
    }
}

