const express = require('express');
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require('../db');


router.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email y contraseña son obligatorios."
        });
    }

    const sql = `
        SELECT id, nombre, email, password, rol, direccion, telefono, fecha_registro
        FROM usuarios
        WHERE email = ?
    `;

    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error("Error al buscar usuario:", err);
            return res.status(500).json({
                success: false,
                message: "Error del servidor."
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Credenciales incorrectas."
            });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error("Error al comparar contraseña:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error al validar las credenciales."
                });
            }

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Credenciales incorrectas."
                });
            }


            req.session.user = {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
                direccion: user.direccion,
                telefono: user.telefono,
                fecha_registro: user.fecha_registro
            };

            return res.json({
                success: true,
                message: "Login correcto",
                usuario: {
                    id: user.id,
                    nombre: user.nombre,
                    email: user.email,
                    rol: user.rol,
                    direccion: user.direccion,
                    telefono: user.telefono,
                    fecha_registro: user.fecha_registro
                }
            });
        });

    });
});



router.post("/register", (req, res) => {
    const { nombre, email, password, direccion, telefono } = req.body;


    if (!nombre || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Nombre, email y contraseña son obligatorios."
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "La contraseña debe tener al menos 6 caracteres."
        });
    }

    const checkSql = "SELECT id FROM usuarios WHERE email = ?";
    db.query(checkSql, [email], (err, results) => {
        if (err) {
            console.error("Error comprobando email:", err);
            return res.status(500).json({
                success: false,
                message: "Error del servidor al comprobar el email."
            });
        }

        if (results.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Ya existe una cuenta con ese correo."
            });
        }


        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                console.error("Error al cifrar contraseña:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error del servidor al crear el usuario."
                });
            }


            const insertSql = `
                INSERT INTO usuarios (nombre, email, password, direccion, telefono, rol)
                VALUES (?, ?, ?, ?, ?, 'cliente')
            `;

            db.query(
                insertSql,
                [nombre, email, hash, direccion || null, telefono || null],
                (err, result) => {
                    if (err) {
                        console.error("Error al insertar usuario:", err);
                        return res.status(500).json({
                            success: false,
                            message: "Error al registrar el usuario."
                        });
                    }

                    return res.status(201).json({
                        success: true,
                        message: "Usuario registrado correctamente. Ya puedes iniciar sesión."
                    });
                }
            );
        });
    });
});



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


router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error al cerrar sesión:", err);
            return res.status(500).json({
                success: false,
                message: "No se pudo cerrar la sesión"
            });
        }

        res.clearCookie('connect.sid');
        return res.json({
            success: true,
            message: "Sesión cerrada correctamente"
        });
    });
});



module.exports = router;
