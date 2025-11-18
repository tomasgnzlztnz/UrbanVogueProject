document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    // Puedes añadir un <p id="loginError"> en el HTML para mostrar mensajes
    const errorBox = document.getElementById('loginError');

    if (!form) {
        console.error('No se encontró el formulario con id="loginForm"');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // evita recargar la página

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (errorBox) {
            errorBox.textContent = ''; // limpiar error anterior
        }

        try {
            const data = await login(email, password); // función de auth.js
            console.log('Login OK:', data);

            // Aquí puedes redirigir a la página principal
            window.location.href = '/index.html';
        } catch (err) {
            console.error('Error en el login:', err);
            if (errorBox) {
                errorBox.textContent = err.message || 'Error al iniciar sesión';
            } else {
                alert(err.message || 'Error al iniciar sesión');
            }
        }
    });
});
