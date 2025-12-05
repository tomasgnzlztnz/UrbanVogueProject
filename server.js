require("dotenv").config();

const path = require("path");
const express = require("express");
const db = require("./db");
const authRoutes = require("./routes/authRoutes");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { sendOrderConfirmationEmail } = require("./mailer");
const { sendNewsletterWelcomeEmail } = require("./mailer");

// Configuración de la app
const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000', // luego lo ajustamos según dónde sirvas el front
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret_urbanvogue", 
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // en desarrollo (http). En producción debe ser true con HTTPS
      maxAge: 1000 * 60 * 60 * 2 // 2 horas
    }
  })
);

// Servir archivos estáticos del frontend (carpeta /app)
app.use(express.static(path.join(__dirname, 'app')));

// Rutas de autenticación
app.use('/api/auth', authRoutes);
// Rutas de usuario (perfil)
app.use('/api/user', userRoutes);
// Rutas de admin
app.use('/api/admin', adminRoutes);

// GET - Obtener todos los productos
app.get("/productos", (req, res) => {
  const sql = "SELECT * FROM productos";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener productos:", err);
      res.status(500).send("Error del servidor");
    } else {
      res.json(results);
    }
  });
});

// POST - Agregar un nuevo producto
app.post("/productos", (req, res) => {
  const { nombre, descripcion, precio, stock, id_categoria } = req.body;

  if (!nombre || !precio) {
    return res.status(400).json({ error: "Faltan datos obligatorios (nombre, precio)" });
  }

  const sql = "INSERT INTO productos (nombre, descripcion, precio, stock, id_categoria) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [nombre, descripcion, precio, stock, id_categoria], (err, result) => {
    if (err) {
      console.error("Error al insertar producto:", err);
      res.status(500).send("Error al crear el producto");
    } else {
      res.status(201).json({ message: "Producto agregado correctamente", id: result.insertId });
    }
  });
});

// PUT - Editar un producto existente
app.put("/productos/:id", (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, stock, id_categoria } = req.body;

  const sql = `
    UPDATE productos 
    SET nombre = ?, descripcion = ?, precio = ?, stock = ?, id_categoria = ?
    WHERE id = ?
  `;

  db.query(sql, [nombre, descripcion, precio, stock, id_categoria, id], (err, result) => {
    if (err) {
      console.error("Error al actualizar producto:", err);
      res.status(500).send("Error al actualizar el producto");
    } else if (result.affectedRows === 0) {
      res.status(404).json({ error: "Producto no encontrado" });
    } else {
      res.json({ message: "Producto actualizado correctamente" });
    }
  });
});

// DELETE - Eliminar un producto
app.delete("/productos/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM productos WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar producto:", err);
      res.status(500).send("Error al eliminar el producto");
    } else if (result.affectedRows === 0) {
      res.status(404).json({ error: "Producto no encontrado" });
    } else {
      res.json({ message: "Producto eliminado correctamente" });
    }
  });
});

// GET - Obtener productos por categoría (por ID de categoría)
app.get("/productos/categoria/:idCategoria", (req, res) => {
  const idCategoria = Number(req.params.idCategoria);

  if (!idCategoria || isNaN(idCategoria)) {
    return res.status(400).json({ error: "Categoría no válida" });
  }

  const sql = `
    SELECT 
      p.*,
      c.nombre AS categoria_nombre
    FROM productos p
    JOIN categorias c ON p.id_categoria = c.id
    WHERE c.id = ?
  `;

  db.query(sql, [idCategoria], (err, results) => {
    if (err) {
      console.error("Error al obtener productos por categoría:", err);
      return res.status(500).send("Error del servidor");
    }

    res.json(results);
  });
});

// GET - Productos de Novedades (últimos 14 días)
app.get("/productos/novedades", (req, res) => {
  const sql = `
    SELECT *
    FROM productos
    WHERE fecha_creacion >= NOW() - INTERVAL 14 DAY
    ORDER BY fecha_creacion DESC
    LIMIT 20
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener novedades:", err);
      return res.status(500).send("Error del servidor al obtener novedades.");
    }

    res.json(results);
  });
});

// GET - Productos en rebajas: 5 más baratos por categoría
app.get("/productos/rebajas", (req, res) => {
  // Lista de categorías que queremos mostrar
  const categorias = ["Camisetas", "Sudaderas", "Pantalones", "Accesorios"];

  const resultados = [];
  let pendientes = categorias.length;

  categorias.forEach((nombreCat) => {
    const sql = `
      SELECT p.*
      FROM productos p
      JOIN categorias c ON p.id_categoria = c.id
      WHERE c.nombre = ?
      ORDER BY p.precio ASC
      LIMIT 5
    `;

    db.query(sql, [nombreCat], (err, rows) => {
      if (err) {
        console.error("Error al obtener productos de rebajas:", err);
        // Para simplificar, si una categoría falla devolvemos error general
        return res.status(500).json({ error: "Error al obtener productos de rebajas." });
      }

      resultados.push({
        categoria: nombreCat,
        productos: rows
      });

      pendientes--;

      // Cuando hayamos terminado todas las consultas…
      if (pendientes === 0) {
        res.json(resultados);
      }
    });
  });
});

// GET - Productos destacados: el de mayor stock por categoría (sin accesorios)
app.get("/productos/destacados", (req, res) => {
  // Categorías que queremos considerar para destacados
  const categorias = ["Camisetas", "Sudaderas", "Pantalones"];

  const resultados = [];
  let pendientes = categorias.length;

  categorias.forEach((nombreCat) => {
    const sql = `
      SELECT p.*
      FROM productos p
      JOIN categorias c ON p.id_categoria = c.id
      WHERE c.nombre = ?
      ORDER BY p.stock DESC
      LIMIT 1
    `;

    db.query(sql, [nombreCat], (err, rows) => {
      if (err) {
        console.error("Error al obtener productos destacados:", err);
        return res
          .status(500)
          .json({ error: "Error al obtener productos destacados." });
      }

      // Puede que alguna categoría no tenga productos aún
      resultados.push({
        categoria: nombreCat,
        producto: rows[0] || null,
      });

      pendientes--;

      if (pendientes === 0) {
        res.json(resultados);
      }
    });
  });
});

// POST - Añadir producto al carrito del usuario logueado
app.post("/api/cart/add", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Debes iniciar sesión para usar el carrito." });
  }

  const userId = req.session.user.id;
  const { productId, cantidad, talla } = req.body;

  const qty = cantidad && cantidad > 0 ? cantidad : 1;

  const sqlBuscarCarrito = "SELECT id FROM carrito WHERE id_usuario = ? LIMIT 1";

  db.query(sqlBuscarCarrito, [userId], (err, results) => {
    if (err) {
      console.error("Error al buscar carrito:", err);
      return res.status(500).json({ error: "Error al buscar el carrito." });
    }

    let carritoId;

    if (results.length === 0) {
      const sqlCrearCarrito = "INSERT INTO carrito (id_usuario) VALUES (?)";
      db.query(sqlCrearCarrito, [userId], (err2, result2) => {
        if (err2) {
          console.error("Error al crear carrito:", err2);
          return res.status(500).json({ error: "Error al crear el carrito." });
        }

        carritoId = result2.insertId;
        agregarItemCarrito(carritoId, productId, qty, talla, res);
      });
    } else {
      carritoId = results[0].id;
      agregarItemCarrito(carritoId, productId, qty, talla, res);
    }
  });
});

// Función auxiliar para insertar/actualizar el ítem en carrito_items
function agregarItemCarrito(idCarrito, idProducto, cantidad, tallaSeleccionada, res) {
  const sqlStock = "SELECT stock FROM productos WHERE id = ?";

  db.query(sqlStock, [idProducto], (err, rows) => {
    if (err) {
      console.error("Error al consultar stock:", err);
      return res.status(500).json({ error: "Error al consultar el stock." });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }

    const stockDisponible = rows[0].stock;

    const sqlBuscarItem = `
      SELECT id, cantidad, talla
      FROM carrito_items
      WHERE id_carrito = ? AND id_producto = ?
      LIMIT 1
    `;

    db.query(sqlBuscarItem, [idCarrito, idProducto], (err2, results) => {
      if (err2) {
        console.error("Error al buscar item de carrito:", err2);
        return res.status(500).json({ error: "Error al buscar el producto en el carrito." });
      }

      // Normalizamos la talla: si no viene nada, usamos "M"
      const tallaFinal = tallaSeleccionada && tallaSeleccionada.trim() !== ""
        ? tallaSeleccionada.trim()
        : "M";

      if (results.length === 0) {
        // No existe aún -> insertar
        const nuevaCantidad = cantidad;

        if (nuevaCantidad > stockDisponible) {
          return res.status(400).json({
            success: false,
            error: `No hay suficiente stock. Stock disponible: ${stockDisponible} unidades.`
          });
        }

        const sqlInsertItem = `
          INSERT INTO carrito_items (id_carrito, id_producto, cantidad, talla)
          VALUES (?, ?, ?, ?)
        `;
        db.query(sqlInsertItem, [idCarrito, idProducto, nuevaCantidad, tallaFinal], (err3) => {
          if (err3) {
            console.error("Error al insertar item en carrito:", err3);
            return res.status(500).json({ error: "Error al añadir el producto al carrito." });
          }

          return res.json({ success: true, message: "Producto añadido al carrito." });
        });

      } else {
        // Ya existe → sumamos cantidad y, si se ha enviado talla, la actualizamos
        const item = results[0];
        const cantidadActual = item.cantidad;
        const nuevaCantidad = cantidadActual + cantidad;

        if (nuevaCantidad > stockDisponible) {
          return res.status(400).json({
            success: false,
            error: `No puedes añadir más de ${stockDisponible} unidades (stock máximo).`
          });
        }

        const sqlUpdateItem = `
          UPDATE carrito_items
          SET cantidad = ?, talla = ?
          WHERE id = ?
        `;

        db.query(sqlUpdateItem, [nuevaCantidad, tallaFinal, item.id], (err4) => {
          if (err4) {
            console.error("Error al actualizar cantidad en carrito:", err4);
            return res.status(500).json({ error: "Error al actualizar el producto en el carrito." });
          }

          return res.json({ success: true, message: "Cantidad/talla actualizadas en el carrito." });
        });
      }
    });
  });
}

// GET - Obtener el carrito del usuario logueado
app.get("/api/cart", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "No has iniciado sesión." });
  }

  const userId = req.session.user.id;

  // Buscamos el carrito de ese usuario
  const sqlCarrito = "SELECT id FROM carrito WHERE id_usuario = ? LIMIT 1";

  db.query(sqlCarrito, [userId], (err, results) => {
    if (err) {
      console.error("Error al buscar carrito:", err);
      return res.status(500).json({ error: "Error al buscar el carrito." });
    }

    if (results.length === 0) {
      // Usuario sin carrito todavía
      return res.json({
        items: [],
        total: 0
      });
    }

    const carritoId = results[0].id;

    // Traemos los items y datos de producto
    const sqlItems = `
  SELECT 
    ci.id           AS item_id,
    p.id            AS product_id,
    p.nombre        AS nombre,
    p.precio        AS precio,
    ci.cantidad     AS cantidad,
    ci.talla        AS talla,
    (p.precio * ci.cantidad) AS total_linea
  FROM carrito_items ci
  JOIN productos p ON ci.id_producto = p.id
  WHERE ci.id_carrito = ?
`;


    db.query(sqlItems, [carritoId], (err2, rows) => {
      if (err2) {
        console.error("Error al obtener items del carrito:", err2);
        return res.status(500).json({ error: "Error al obtener los productos del carrito." });
      }

      const total = rows.reduce((sum, item) => sum + Number(item.total_linea), 0);

      return res.json({
        items: rows,
        total: total
      });
    });
  });
});

// DELETE ALL PRODUCTS INDIVIDUALLY - Eliminar un producto concreto del carrito(elimina todos los productos de ese tipo)
app.delete("/api/cart/item/:itemId", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "No has iniciado sesión." });
  }

  const userId = req.session.user.id;
  const itemId = req.params.itemId;

  // Nos aseguramos de que el item pertenece al carrito de este usuario
  const sql = `
    DELETE ci FROM carrito_items ci
    JOIN carrito c ON ci.id_carrito = c.id
    WHERE ci.id = ? AND c.id_usuario = ?
  `;

  db.query(sql, [itemId, userId], (err, result) => {
    if (err) {
      console.error("Error al eliminar item del carrito:", err);
      return res.status(500).json({ error: "Error al eliminar el producto del carrito." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado en tu carrito." });
    }

    res.json({ success: true, message: "Producto eliminado del carrito." });
  });
});

// POST - Decrementar en 1 la cantidad de un item del carrito
app.post("/api/cart/item/:itemId/decrement", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "No has iniciado sesión." });
  }

  const userId = req.session.user.id;
  const itemId = req.params.itemId;

  // Comprobar que el item pertenece al carrito del usuario
  const sqlBuscar = `
    SELECT ci.id, ci.cantidad
    FROM carrito_items ci
    JOIN carrito c ON ci.id_carrito = c.id
    WHERE ci.id = ? AND c.id_usuario = ?
    LIMIT 1
  `;

  db.query(sqlBuscar, [itemId, userId], (err, results) => {
    if (err) {
      console.error("Error al buscar item para decrementar:", err);
      return res.status(500).json({ error: "Error al buscar el producto en el carrito." });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado en tu carrito." });
    }

    const item = results[0];

    if (item.cantidad > 1) {
      // Resta 1 unidad
      const sqlUpdate = `
        UPDATE carrito_items
        SET cantidad = cantidad - 1
        WHERE id = ?
      `;
      db.query(sqlUpdate, [itemId], (err2) => {
        if (err2) {
          console.error("Error al decrementar cantidad:", err2);
          return res.status(500).json({ error: "Error al actualizar la cantidad." });
        }

        return res.json({
          success: true,
          message: "Cantidad actualizada (−1).",
          removed: false
        });
      });
    } else {
      // Si la cantidad era 1 → eliminar la fila
      const sqlDelete = `
        DELETE FROM carrito_items
        WHERE id = ?
      `;
      db.query(sqlDelete, [itemId], (err3) => {
        if (err3) {
          console.error("Error al eliminar item:", err3);
          return res.status(500).json({ error: "Error al eliminar el producto del carrito." });
        }

        return res.json({
          success: true,
          message: "Producto eliminado del carrito.",
          removed: true
        });
      });
    }
  });
});

// POST - Vaciar todo el carrito del usuario logueado
app.post("/api/cart/clear", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "No has iniciado sesión." });
  }

  const userId = req.session.user.id;

  // Borramos todos los items de SU carrito
  const sql = `
    DELETE ci FROM carrito_items ci
    JOIN carrito c ON ci.id_carrito = c.id
    WHERE c.id_usuario = ?
  `;

  db.query(sql, [userId], (err) => {
    if (err) {
      console.error("Error al vaciar carrito:", err);
      return res.status(500).json({ error: "Error al vaciar el carrito." });
    }

    res.json({ success: true, message: "Carrito vaciado correctamente." });
  });
});

// POST - Checkout: crear pedido a partir del carrito y vaciarlo + enviar email de confirmación
app.post("/api/cart/checkout", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "No has iniciado sesión." });
  }

  const userId = req.session.user.id;
  const userEmail = req.session.user.email;
  const userNombre = req.session.user.nombre;

  // 1) Buscar carrito
  const sqlCarrito = "SELECT id FROM carrito WHERE id_usuario = ? LIMIT 1";

  db.query(sqlCarrito, [userId], (err, results) => {
    if (err) {
      console.error("Error al buscar carrito (checkout):", err);
      return res.status(500).json({ error: "Error al procesar el pedido." });
    }

    if (results.length === 0) {
      return res.status(400).json({ error: "Tu carrito está vacío." });
    }

    const carritoId = results[0].id;

    // 2) Obtener items del carrito (añadimos nombre y talla si la tuvieras en carrito_items)
    const sqlItems = `
      SELECT 
        ci.id           AS item_id,
        p.id            AS product_id,
        p.nombre        AS nombre,
        p.precio        AS precio,
        ci.cantidad     AS cantidad,
        ci.talla        AS talla   -- si tu tabla carrito_items no tiene talla, quita esta línea
      FROM carrito_items ci
      JOIN productos p ON ci.id_producto = p.id
      WHERE ci.id_carrito = ?
    `;

    db.query(sqlItems, [carritoId], (err2, items) => {
      if (err2) {
        console.error("Error al obtener items para checkout:", err2);
        return res.status(500).json({ error: "Error al procesar el pedido." });
      }

      if (items.length === 0) {
        return res.status(400).json({ error: "Tu carrito está vacío." });
      }

      const total = items.reduce(
        (sum, it) => sum + Number(it.precio) * it.cantidad,
        0
      );

      // 3) Crear pedido
      const sqlInsertPedido = `
        INSERT INTO pedidos (id_usuario, total, estado)
        VALUES (?, ?, 'pendiente')
      `;

      db.query(sqlInsertPedido, [userId, total], (err3, resultPedido) => {
        if (err3) {
          console.error("Error al crear pedido:", err3);
          return res.status(500).json({ error: "Error al crear el pedido." });
        }

        const pedidoId = resultPedido.insertId;

        // 4) Insertar detalle_pedido
        const sqlDetalle = `
          INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, talla, precio_unitario)
          VALUES ?
        `;

        const values = items.map((it) => [
          pedidoId,
          it.product_id,
          it.cantidad,
          it.talla || "M", // talla por defecto si no hubiera
          it.precio,
        ]);

        db.query(sqlDetalle, [values], async (err4) => {
          if (err4) {
            console.error("Error al insertar detalle del pedido:", err4);
            return res
              .status(500)
              .json({ error: "Error al crear el detalle del pedido." });
          }

          // 5) Vaciar carrito
          const sqlVaciar = "DELETE FROM carrito_items WHERE id_carrito = ?";

          db.query(sqlVaciar, [carritoId], async (err5) => {
            if (err5) {
              console.error(
                "Error al vaciar carrito tras checkout:",
                err5
              );
              return res.status(500).json({
                error:
                  "Pedido creado, pero error al vaciar el carrito.",
              });
            }

            // 6) Intentar enviar el email de confirmación (NO rompemos si falla)
            try {
              if (userEmail) {
                await sendOrderConfirmationEmail({
                  to: userEmail,
                  nombre: userNombre,
                  pedidoId,
                  total,
                  items: items.map((it) => ({
                    nombre: it.nombre,
                    cantidad: it.cantidad,
                    talla: it.talla || "M",
                    precio: it.precio,
                  })),
                });
              } else {
                console.warn(
                  "Usuario sin email, no se envía correo de confirmación."
                );
              }
            } catch (emailErr) {
              console.error(
                "Error al enviar el correo de confirmación:",
                emailErr
              );
              // NO hacemos return, el pedido ya está creado
            }

            // 7) Respuesta OK al cliente
            res.json({
              success: true,
              message: "Pedido creado correctamente.",
              pedidoId,
              total,
            });
          });
        });
      });
    });
  });
});

// POST - Cambiar talla de un ítem del carrito
app.post("/api/cart/item/:itemId/size", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "No has iniciado sesión." });
  }

  const userId = req.session.user.id;
  const itemId = req.params.itemId;
  const { talla } = req.body;

  const tallaFinal = talla && talla.trim() !== "" ? talla.trim() : "M";

  const sql = `
    UPDATE carrito_items ci
    JOIN carrito c ON ci.id_carrito = c.id
    SET ci.talla = ?
    WHERE ci.id = ? AND c.id_usuario = ?
  `;

  db.query(sql, [tallaFinal, itemId, userId], (err, result) => {
    if (err) {
      console.error("Error al actualizar talla del item:", err);
      return res.status(500).json({ error: "Error al actualizar la talla del producto." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado en tu carrito." });
    }

    res.json({ success: true, message: "Talla actualizada correctamente." });
  });
});

// LISTAR TODAS LAS CATEGORÍAS (público)
app.get("/categorias", (req, res) => {
  const sql = `
    SELECT id, nombre, descripcion
    FROM categorias
    ORDER BY nombre ASC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Error al obtener categorías públicas:", err);
      return res.status(500).json({ error: "Error al obtener las categorías." });
    }

    res.json(rows); // array de { id, nombre, descripcion }
  });
});


// ===============================
//  BÚSQUEDA GLOBAL DE PRODUCTOS
//  GET /api/search?q=texto
// ===============================
app.get("/api/search", (req, res) => {
  const q = (req.query.q || "").trim();

  // Si la query está vacía, devolvemos lista vacía
  if (q.length === 0) {
    return res.json({
      success: true,
      results: []
    });
  }

  // Búsqueda parcial (LIKE %q%) en nombre y descripción
  const like = `%${q}%`;

  const sql = `
    SELECT 
      id,
      nombre,
      descripcion,
      precio,
      imagen
    FROM productos
    WHERE 
      nombre LIKE ? 
      OR (descripcion IS NOT NULL AND descripcion LIKE ?)
    ORDER BY fecha_creacion DESC
    LIMIT 20
  `;

  db.query(sql, [like, like], (err, results) => {
    if (err) {
      console.error("Error en búsqueda:", err);
      return res.status(500).json({
        success: false,
        message: "Error al realizar la búsqueda."
      });
    }

    return res.json({
      success: true,
      results
    });
  });
});


// ===============================
//  NEWSLETTER: SUSCRIPCIÓN
//  POST /api/newsletter/subscribe
// ===============================
app.post("/api/newsletter/subscribe", (req, res) => {
  const { email } = req.body;

  // Validación básica de email
  if (!email || typeof email !== "string") {
    return res.status(400).json({
      success: false,
      message: "Debes indicar un correo electrónico."
    });
  }

  const emailLimpio = email.trim().toLowerCase();

  // RegEx sencillito, no perfecto pero suficiente para un TFG
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLimpio)) {
    return res.status(400).json({
      success: false,
      message: "El formato del correo no es válido."
    });
  }

  // 1) Comprobar si ya existe ese email
  const checkSql = "SELECT id FROM newsletter_suscriptores WHERE email = ?";

  db.query(checkSql, [emailLimpio], (err, rows) => {
    if (err) {
      console.error("Error comprobando suscriptor:", err);
      return res.status(500).json({
        success: false,
        message: "Error interno al comprobar el correo."
      });
    }

    if (rows.length > 0) {
      // Ya estaba suscrito → no es un error grave
      return res.json({
        success: true,
        message: "Este correo ya estaba suscrito a las novedades."
      });
    }

    // 2) Insertar nuevo suscriptor
    const insertSql = `
      INSERT INTO newsletter_suscriptores (email)
      VALUES (?)
    `;

    db.query(insertSql, [emailLimpio], async (err2, result) => {
      if (err2) {
        console.error("Error insertando suscriptor:", err2);
        return res.status(500).json({
          success: false,
          message: "No se pudo registrar el correo."
        });
      }

      // 3) Intentamos enviar email de bienvenida (sin bloquear la respuesta)
      (async () => {
        try {
          await sendNewsletterWelcomeEmail(emailLimpio);
        } catch (errMail) {
          console.error("Error enviando email de newsletter:", errMail);
          // No rompemos nada si falla el correo: el usuario ya está guardado
        }
      })();

      return res.status(201).json({
        success: true,
        message: "Te has suscrito correctamente a las novedades."
      });
    });
  });
});


// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en marcha en http://localhost:${PORT}`));
