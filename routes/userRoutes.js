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

// GET /api/user/orders  → obtener pedidos del usuario logueado
router.get("/orders", requireAuth, (req, res) => {
    const userId = req.session.user.id;

    const sql = `
        SELECT
            pe.id              AS pedido_id,
            pe.fecha_pedido    AS fecha_pedido,
            pe.total           AS total_pedido,
            pe.estado          AS estado_pedido,
            dp.id              AS detalle_id,
            dp.id_producto     AS producto_id,
            dp.cantidad        AS cantidad,
            dp.talla           AS talla,
            dp.precio_unitario AS precio_unitario,
            pr.nombre          AS producto_nombre,
            pr.imagen          AS producto_imagen
        FROM pedidos pe
        JOIN detalle_pedido dp ON dp.id_pedido = pe.id
        JOIN productos pr      ON pr.id = dp.id_producto
        WHERE pe.id_usuario = ?
        ORDER BY pe.fecha_pedido DESC, pe.id DESC, dp.id ASC
    `;

    db.query(sql, [userId], (err, rows) => {
        if (err) {
            console.error("Error al obtener pedidos del usuario:", err);
            return res.status(500).json({
                success: false,
                message: "Error al obtener tus pedidos."
            });
        }

        if (!rows || rows.length === 0) {
            return res.json({
                success: true,
                pedidos: []
            });
        }

        // Agrupar por pedido
        const pedidosMap = new Map();

        rows.forEach(row => {
            if (!pedidosMap.has(row.pedido_id)) {
                pedidosMap.set(row.pedido_id, {
                    id:     row.pedido_id,
                    fecha:  row.fecha_pedido,
                    total:  row.total_pedido,
                    estado: row.estado_pedido,
                    items:  []
                });
            }

            const pedido = pedidosMap.get(row.pedido_id);

            pedido.items.push({
                detalleId:      row.detalle_id,
                productoId:     row.producto_id,
                nombre:         row.producto_nombre,
                talla:          row.talla,
                cantidad:       row.cantidad,
                precioUnitario: row.precio_unitario,
                subtotal:       Number(row.precio_unitario) * Number(row.cantidad),
                imagen:         row.producto_imagen
            });
        });

        const pedidos = Array.from(pedidosMap.values());

        return res.json({
            success: true,
            pedidos
        });
    });
});


module.exports = router;
