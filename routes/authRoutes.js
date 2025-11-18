const express = require('express');
const router = express.Router();
const db = require('../db');

// LOGIN
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Faltan campos por rellenar (email y password)",
        });
    }

    const sql = "SELECT * FROM usuarios WHERE email = ? LIMIT 1";

    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error("Error al buscar usuario:", err);
            return res.status(500).json({
                success: false,
                message: "Error interno del servidor",
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                success: false,
                message: "El usuario no existe",
            });
        }

        const user = results[0];

        if (user.password !== password) {
            return res.status(401).json({
                success: false,
                message: "Contraseña incorrecta",
            });
        }

        // Guardar datos en la sesión
        req.session.user = {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
        };

        // Si llegamos aquí, el login es correcto
        return res.status(200).json({
            success: true,
            message: "Login correcto",
            usuario: req.session.user
        });
    });
});

// REGISTER
router.post('/register', (req, res) => {
    const { nombre, email, password } = req.body;

    // 1) Validar campos
    if (!nombre || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Faltan campos por rellenar (nombre, email, password)"
        });
    }

    // 2) Comprobar si ya existe un usuario con ese email
    const checkQuery = "SELECT id FROM usuarios WHERE email = ? LIMIT 1";

    db.query(checkQuery, [email], (err, results) => {
        if (err) {
            console.error("Error al comprobar email:", err);
            return res.status(500).json({
                success: false,
                message: "Error interno del servidor"
            });
        }

        if (results.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Ya existe un usuario con ese email"
            });
        }

        // 3) Insertar nuevo usuario
        // De momento guardamos password tal cual (luego lo cambiaremos por un hash)
        const insertQuery = `
            INSERT INTO usuarios (nombre, email, password, rol)
            VALUES (?, ?, ?, 'cliente')
        `;

        db.query(insertQuery, [nombre, email, password], (err, result) => {
            if (err) {
                console.error("Error al registrar usuario:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error al crear el usuario"
                });
            }

            return res.status(201).json({
                success: true,
                message: "Usuario registrado correctamente",
                usuario: {
                    id: result.insertId,
                    nombre,
                    email,
                    rol: 'cliente'
                }
            });
        });
    });
});

// ROLL USER BACK
router.get('/me', (req, res) => {
    if (!req.session.user) {
        return res.json({
            autenticado: false,
            usuario: null
        });
    }

    return res.json({
        autenticado: true,
        usuario: req.session.user
    });
});

// LOGOUT
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error al cerrar sesión:", err);
            return res.status(500).json({
                success: false,
                message: "No se pudo cerrar la sesión"
            });
        }

        res.clearCookie('connect.sid'); // nombre por defecto de la cookie de sesión
        return res.json({
            success: true,
            message: "Sesión cerrada correctamente"
        });
    });
});



module.exports = router;
