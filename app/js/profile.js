// app/js/profile.js

document.addEventListener('DOMContentLoaded', async () => {
    const nameEl   = document.getElementById('profileName');
    const emailEl  = document.getElementById('profileEmail');
    const roleEl   = document.getElementById('profileRole');
    const errorEl  = document.getElementById('profileError');

    try {
        // Usamos la función que ya tienes en auth.js
        const data = await fetchCurrentUser(); // { autenticado, usuario }

        console.log('DEBUG profile: estado sesión →', data);

        // Si no está logueado, redirigimos a login
        if (!data.autenticado || !data.usuario) {
            window.location.href = '/pages/login.html';
            return;
        }

        const user = data.usuario;

        // Pintar datos básicos
        if (nameEl)  nameEl.textContent  = user.nombre || '';
        if (emailEl) emailEl.textContent = user.email  || '';
        if (roleEl)  roleEl.textContent  = user.rol === 'admin' ? 'Administrador' : 'Cliente';

    } catch (err) {
        console.error('Error en profile.js:', err);
        if (errorEl) {
            errorEl.textContent = 'Ha ocurrido un error al cargar tu perfil.';
            errorEl.classList.remove('d-none');
        }
    }
});
