document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');


    const errorBox = document.getElementById('loginError');

    if (!form) {
        console.error('No se encontró el formulario con id="loginForm"');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (errorBox) {
            errorBox.textContent = '';
        }

        try {
            const data = await login(email, password);
            console.log('Login OK:', data);
            if (data.rol = "admin") {
                console.log('Redirigiendo a admin...');
                window.location.href = '/pages/admin.html';
                return;
            } else {
                window.location.href = '/index.html';
            }

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
