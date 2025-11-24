// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// Middleware sencillo para exigir sesión
function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: "No autenticado"
        });
    }
    next();
}

// PUT /api/user/me  → actualizar nombre, dirección y teléfono
router.put("/me", requireAuth, (req, res) => {
    const userId = req.session.user.id;
    const { nombre, direccion, telefono } = req.body;

    if (!nombre || nombre.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "El nombre es obligatorio."
        });
    }

    const sql = `
        UPDATE usuarios
        SET nombre = ?, direccion = ?, telefono = ?
        WHERE id = ?
    `;

    db.query(sql, [nombre, direccion || null, telefono || null, userId], (err, result) => {
        if (err) {
            console.error("Error al actualizar perfil:", err);
            return res.status(500).json({
                success: false,
                message: "Error al actualizar el perfil."
            });
        }

        // Actualizamos también los datos de la sesión
        req.session.user = {
            ...req.session.user,
            nombre,
            direccion: direccion || null,
            telefono: telefono || null
        };

        return res.json({
            success: true,
            message: "Perfil actualizado correctamente."
        });
    });
});

module.exports = router;
