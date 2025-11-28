// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// Middleware: solo admins
function requireAdmin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: "No autenticado"
        });
    }

    if (req.session.user.rol !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Acceso solo para administradores"
        });
    }

    next();
}

// ================================
//  CATEGORÍAS (ADMIN)
// ================================

// GET /api/admin/categorias  → listar todas
router.get("/categorias", requireAdmin, (req, res) => {
    const sql = "SELECT id, nombre, descripcion FROM categorias ORDER BY id DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error al obtener categorías:", err);
            return res.status(500).json({
                success: false,
                message: "Error al obtener las categorías"
            });
        }

        return res.json({
            success: true,
            categorias: results
        });
    });
});

// POST /api/admin/categorias  → crear nueva
router.post("/categorias", requireAdmin, (req, res) => {
    const { nombre, descripcion } = req.body;

    if (!nombre || nombre.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "El nombre de la categoría es obligatorio"
        });
    }

    const nombreLimpio = nombre.trim();

    // 1) Comprobar si ya existe una categoría con ese nombre
    const checkSql = "SELECT id FROM categorias WHERE nombre = ?";

    db.query(checkSql, [nombreLimpio], (err, results) => {
        if (err) {
            console.error("Error comprobando categoría:", err);
            return res.status(500).json({
                success: false,
                message: "Error del servidor al comprobar la categoría"
            });
        }

        if (results.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Ya existe una categoría con ese nombre: " + nombreLimpio
            });
        }

        // 2) Si no existe, la creamos
        const insertSql = "INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)";

        db.query(insertSql, [nombreLimpio, descripcion || null], (err, result) => {
            if (err) {
                console.error("Error al crear categoría:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error al crear la categoría"
                });
            }

            return res.status(201).json({
                success: true,
                message: "Categoría creada correctamente",
                id: result.insertId
            });
        });
    });
});



// PUT /api/admin/categorias/:id  → actualizar
router.put("/categorias/:id", requireAdmin, (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    if (!nombre || nombre.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "El nombre de la categoría es obligatorio"
        });
    }

    const nombreLimpio = nombre.trim();

    // 1) Ver si ya hay otra categoría con ese nombre
    const checkSql = "SELECT id FROM categorias WHERE nombre = ? AND id <> ?";

    db.query(checkSql, [nombreLimpio, id], (err, results) => {
        if (err) {
            console.error("Error comprobando categoría (update):", err);
            return res.status(500).json({
                success: false,
                message: "Error del servidor al comprobar la categoría"
            });
        }

        if (results.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Ya existe otra categoría con ese nombre."
            });
        }

        // 2) Si no hay conflicto, actualizamos
        const updateSql = `
            UPDATE categorias
            SET nombre = ?, descripcion = ?
            WHERE id = ?
        `;

        db.query(updateSql, [nombreLimpio, descripcion || null, id], (err, result) => {
            if (err) {
                console.error("Error al actualizar categoría:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error al actualizar la categoría"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Categoría no encontrada"
                });
            }

            return res.json({
                success: true,
                message: "Categoría actualizada correctamente"
            });
        });
    });
});


// DELETE /api/admin/categorias/:id  → borrar
router.delete("/categorias/:id", requireAdmin, (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM categorias WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error al eliminar categoría:", err);
            return res.status(500).json({
                success: false,
                message: "Error al eliminar la categoría"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Categoría no encontrada"
            });
        }

        return res.json({
            success: true,
            message: "Categoría eliminada correctamente"
        });
    });
});


// ================================
//  PRODUCTOS (ADMIN)
// ================================

// GET /api/admin/productos → listar todos los productos con nombre de categoría
router.get("/productos", requireAdmin, (req, res) => {
    const sql = `
        SELECT 
            p.id,
            p.nombre,
            p.descripcion,
            p.precio,
            p.stock,
            p.talla,
            p.color,
            p.imagen,
            p.id_categoria,
            c.nombre AS categoria_nombre
        FROM productos p
        LEFT JOIN categorias c ON p.id_categoria = c.id
        ORDER BY p.id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error al obtener productos (admin):", err);
            return res.status(500).json({
                success: false,
                message: "Error al obtener los productos"
            });
        }

        return res.json({
            success: true,
            productos: results
        });
    });
});

// POST /api/admin/productos → crear producto
router.post("/productos", requireAdmin, (req, res) => {
    const { nombre, descripcion, precio, stock, talla, color, imagen, id_categoria } = req.body;

    if (!nombre || nombre.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "El nombre del producto es obligatorio."
        });
    }

    if (!precio || isNaN(precio)) {
        return res.status(400).json({
            success: false,
            message: "El precio es obligatorio y debe ser numérico."
        });
    }

    // ✅ Categoría obligatoria
    if (!id_categoria) {
        return res.status(400).json({
            success: false,
            message: "La categoría es obligatoria."
        });
    }

    const nombreLimpio = nombre.trim();
    const precioNum = Number(precio);
    const stockNum = stock ? Number(stock) : 0;

    // ✅ Imagen por defecto si no viene nada
    const imagenFinal = (imagen && imagen.trim() !== "")
        ? imagen.trim()
        : "/img/clothes/TH-shirt.jpg";

    // ✅ Comprobar que no existe ya un producto con el mismo nombre
    const checkSql = "SELECT id FROM productos WHERE nombre = ?";

    db.query(checkSql, [nombreLimpio], (err, results) => {
        if (err) {
            console.error("Error comprobando producto:", err);
            return res.status(500).json({
                success: false,
                message: "Error del servidor al comprobar el producto."
            });
        }

        if (results.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Ya existe un producto con ese nombre."
            });
        }

        // Si no hay duplicado → insertar
        const insertSql = `
            INSERT INTO productos
                (nombre, descripcion, precio, stock, talla, color, imagen, id_categoria)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            insertSql,
            [
                nombreLimpio,
                descripcion || null,
                precioNum,
                stockNum,
                talla || null,
                color || null,
                imagenFinal,
                id_categoria
            ],
            (err, result) => {
                if (err) {
                    console.error("Error al crear producto:", err);
                    return res.status(500).json({
                        success: false,
                        message: "Error al crear el producto."
                    });
                }

                return res.status(201).json({
                    success: true,
                    message: "Producto creado correctamente.",
                    id: result.insertId
                });
            }
        );
    });
});

// PUT /api/admin/productos/:id → actualizar producto
router.put("/productos/:id", requireAdmin, (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, talla, color, imagen, id_categoria } = req.body;

    if (!nombre || nombre.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "El nombre del producto es obligatorio."
        });
    }

    if (!precio || isNaN(precio)) {
        return res.status(400).json({
            success: false,
            message: "El precio es obligatorio y debe ser numérico."
        });
    }

    // ✅ Categoría obligatoria también al editar
    if (!id_categoria) {
        return res.status(400).json({
            success: false,
            message: "La categoría es obligatoria."
        });
    }

    const nombreLimpio = nombre.trim();
    const precioNum = Number(precio);
    const stockNum = stock ? Number(stock) : 0;

    // ✅ Imagen por defecto si viene vacía
    const imagenFinal = (imagen && imagen.trim() !== "")
        ? imagen.trim()
        : "/img/clothes/TH-shirt.jpg";

    // ✅ Comprobar si ya hay OTRO producto con ese nombre
    const checkSql = "SELECT id FROM productos WHERE nombre = ? AND id <> ?";

    db.query(checkSql, [nombreLimpio, id], (err, results) => {
        if (err) {
            console.error("Error comprobando producto (update):", err);
            return res.status(500).json({
                success: false,
                message: "Error del servidor al comprobar el producto."
            });
        }

        if (results.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Ya existe otro producto con ese nombre."
            });
        }

        // Si no hay conflicto → actualizar
        const updateSql = `
            UPDATE productos
            SET 
                nombre       = ?,
                descripcion  = ?,
                precio       = ?,
                stock        = ?,
                talla        = ?,
                color        = ?,
                imagen       = ?,
                id_categoria = ?
            WHERE id = ?
        `;

        db.query(
            updateSql,
            [
                nombreLimpio,
                descripcion || null,
                precioNum,
                stockNum,
                talla || null,
                color || null,
                imagenFinal,
                id_categoria,
                id
            ],
            (err, result) => {
                if (err) {
                    console.error("Error al actualizar producto:", err);
                    return res.status(500).json({
                        success: false,
                        message: "Error al actualizar el producto."
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Producto no encontrado."
                    });
                }

                return res.json({
                    success: true,
                    message: "Producto actualizado correctamente."
                });
            }
        );
    });
});


// DELETE /api/admin/productos/:id → borrar producto
router.delete("/productos/:id", requireAdmin, (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM productos WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error al eliminar producto:", err);
            return res.status(500).json({
                success: false,
                message: "Error al eliminar el producto."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Producto no encontrado."
            });
        }

        return res.json({
            success: true,
            message: "Producto eliminado correctamente."
        });
    });
});

// +1 stock
router.post("/productos/:id/increment", async (req, res) => {
    const id = req.params.id;

    db.query("UPDATE productos SET stock = stock + 1 WHERE id = ?", [id],
        (err) => {
            if (err) return res.json({ success: false });
            res.json({ success: true });
        });
});

// -1 stock
router.post("/productos/:id/decrement", async (req, res) => {
    const id = req.params.id;

    db.query("UPDATE productos SET stock = GREATEST(stock - 1, 0) WHERE id = ?", [id],
        (err) => {
            if (err) return res.json({ success: false });
            res.json({ success: true });
        });
});


// ===================== USUARIOS =====================

// GET /api/admin/usuarios  → listar usuarios
router.get('/usuarios', requireAdmin, (req, res) => {
    const sql = `
        SELECT id, nombre, email, rol, fecha_registro
        FROM usuarios
        ORDER BY fecha_registro DESC
    `;

    db.query(sql, (err, rows) => {
        if (err) {
            console.error("Error obteniendo usuarios:", err);
            return res.status(500).json({
                success: false,
                message: "Error al obtener usuarios."
            });
        }

        res.json({
            success: true,
            usuarios: rows
        });
    });
});

// POST /api/admin/usuarios/:id/rol  → cambiar rol
router.post('/usuarios/:id/rol', requireAdmin, (req, res) => {
    const userId = req.params.id;
    const { rol } = req.body; // "admin" o "cliente"

    if (!rol || !['admin', 'cliente'].includes(rol)) {
        return res.status(400).json({
            success: false,
            message: "Rol inválido."
        });
    }

    // 1) Miramos cuántos admins hay
    const countAdminsSql = `
        SELECT 
            SUM(CASE WHEN rol = 'admin' THEN 1 ELSE 0 END) AS total_admins
        FROM usuarios
    `;

    db.query(countAdminsSql, (err, countRows) => {
        if (err) {
            console.error("Error contando admins:", err);
            return res.status(500).json({
                success: false,
                message: "Error interno al cambiar rol."
            });
        }

        const totalAdmins = countRows[0].total_admins || 0;

        // 2) Si vamos a pasar a cliente, comprobamos que no sea el único admin
        if (rol === 'cliente' && totalAdmins <= 1) {
            return res.status(400).json({
                success: false,
                message: "No se puede quitar el rol admin al único administrador del sistema."
            });
        }

        // 3) Actualizamos rol
        const updateSql = `UPDATE usuarios SET rol = ? WHERE id = ?`;

        db.query(updateSql, [rol, userId], (err2, result) => {
            if (err2) {
                console.error("Error actualizando rol de usuario:", err2);
                return res.status(500).json({
                    success: false,
                    message: "Error al actualizar el rol del usuario."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Usuario no encontrado."
                });
            }

            res.json({
                success: true,
                message: `Rol actualizado a '${rol}' correctamente.`
            });
        });
    });
});

// ===============================
//  GET - Listado de Newsletter
// ===============================
router.get("/newsletter/list", (req, res) => {
  const sql = `
        SELECT id, email, fecha_suscripcion
        FROM newsletter_suscriptores
        ORDER BY fecha_suscripcion DESC
    `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Error obteniendo newsletter:", err);
      return res.status(500).json({
        success: false,
        message: "Error al obtener los suscriptores"
      });
    }

    return res.json({
      success: true,
      suscriptores: rows
    });
  });
});




module.exports = router;
