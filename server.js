const path = require("path");
const express = require("express");
const db = require("./db");
const authRoutes = require("./routes/authRoutes");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");



// Configuración de la app
const app = express();

app.use(cors({
  origin: 'http://localhost:3000', // luego lo ajustamos según dónde sirvas el front
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: "ahahahaha", // cadena para firmar la cookie
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // en desarrollo (http). En producción debe ser true con HTTPS
      maxAge: 1000 * 60 * 60 * 2 // 2 horas
    }
  })
);

// Rutas de autenticación
app.use('/api/auth', authRoutes);
// Rutas de usuario (perfil)
app.use('/api/user', userRoutes);
// Rutas de admin
app.use('/api/admin', adminRoutes);

// Servir archivos estáticos del frontend (carpeta /app)
app.use(express.static(path.join(__dirname, 'app')));

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

// GET - Obtener productos por categoría
app.get("/productos/categoria/:slug", (req, res) => {
  const { slug } = req.params;

  // Mapa de slugs a nombres de categoría en BD
  const mapaCategorias = {
    camisetas: "Camisetas",
    sudaderas: "Sudaderas",
    pantalones: "Pantalones",
    accesorios: "Accesorios",
  };

  const nombreCategoria = mapaCategorias[slug];

  if (!nombreCategoria) {
    return res.status(400).json({ error: "Categoría no válida" });
  }

  const sql = `
    SELECT p.*
    FROM productos p
    JOIN categorias c ON p.id_categoria = c.id
    WHERE c.nombre = ?
  `;

  db.query(sql, [nombreCategoria], (err, results) => {
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
  // 1) Comprobar que el usuario está logueado
  if (!req.session.user) {
    return res.status(401).json({ error: "Debes iniciar sesión para usar el carrito." });
  }

  const userId = req.session.user.id;
  const { productId, cantidad } = req.body;

  const qty = cantidad && cantidad > 0 ? cantidad : 1;

  // 2) Buscar si ya existe un carrito para este usuario
  const sqlBuscarCarrito = "SELECT id FROM carrito WHERE id_usuario = ? LIMIT 1";

  db.query(sqlBuscarCarrito, [userId], (err, results) => {
    if (err) {
      console.error("Error al buscar carrito:", err);
      return res.status(500).json({ error: "Error al buscar el carrito." });
    }

    let carritoId;

    if (results.length === 0) {
      // 3) Si no hay carrito → crear uno
      const sqlCrearCarrito = "INSERT INTO carrito (id_usuario) VALUES (?)";
      db.query(sqlCrearCarrito, [userId], (err2, result2) => {
        if (err2) {
          console.error("Error al crear carrito:", err2);
          return res.status(500).json({ error: "Error al crear el carrito." });
        }

        carritoId = result2.insertId;
        // Una vez creado el carrito, añadimos el ítem
        agregarItemCarrito(carritoId, productId, qty, res);
      });
    } else {
      // Ya existe carrito
      carritoId = results[0].id;
      agregarItemCarrito(carritoId, productId, qty, res);
    }
  });
});

// Función auxiliar para insertar/actualizar el ítem en carrito_items
function agregarItemCarrito(idCarrito, idProducto, cantidad, res) {
  // 1) Ver stock del producto
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

    // 2) Ver si ya existe ese producto en el carrito
    const sqlBuscarItem = `
      SELECT id, cantidad
      FROM carrito_items
      WHERE id_carrito = ? AND id_producto = ?
      LIMIT 1
    `;

    db.query(sqlBuscarItem, [idCarrito, idProducto], (err2, results) => {
      if (err2) {
        console.error("Error al buscar item de carrito:", err2);
        return res.status(500).json({ error: "Error al buscar el producto en el carrito." });
      }

      if (results.length === 0) {
        // No existe aún -> queremos insertar cantidad
        const nuevaCantidad = cantidad;

        if (nuevaCantidad > stockDisponible) {
          return res.status(400).json({
            success: false,
            error: `No hay suficiente stock. Stock disponible: ${stockDisponible} unidades.`
          });
        }

        const sqlInsertItem = `
          INSERT INTO carrito_items (id_carrito, id_producto, cantidad)
          VALUES (?, ?, ?)
        `;
        db.query(sqlInsertItem, [idCarrito, idProducto, nuevaCantidad], (err3) => {
          if (err3) {
            console.error("Error al insertar item en carrito:", err3);
            return res.status(500).json({ error: "Error al añadir el producto al carrito." });
          }

          return res.json({ success: true, message: "Producto añadido al carrito." });
        });

      } else {
        // Ya existe → sumamos a la cantidad actual
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
          SET cantidad = ?
          WHERE id = ?
        `;
        db.query(sqlUpdateItem, [nuevaCantidad, item.id], (err4) => {
          if (err4) {
            console.error("Error al actualizar cantidad en carrito:", err4);
            return res.status(500).json({ error: "Error al actualizar el producto en el carrito." });
          }

          return res.json({ success: true, message: "Cantidad actualizada en el carrito." });
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

// POST - Checkout: crear pedido a partir del carrito y vaciarlo
app.post("/api/cart/checkout", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "No has iniciado sesión." });
  }

  const userId = req.session.user.id;

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

    // 2) Obtener items del carrito
    const sqlItems = `
      SELECT 
        ci.id           AS item_id,
        p.id            AS product_id,
        p.precio        AS precio,
        ci.cantidad     AS cantidad
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
          INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario)
          VALUES ?
        `;

        const values = items.map(it => [
          pedidoId,
          it.product_id,
          it.cantidad,
          it.precio
        ]);

        db.query(sqlDetalle, [values], (err4) => {
          if (err4) {
            console.error("Error al insertar detalle del pedido:", err4);
            return res.status(500).json({ error: "Error al crear el detalle del pedido." });
          }

          // 5) Vaciar carrito
          const sqlVaciar = "DELETE FROM carrito_items WHERE id_carrito = ?";

          db.query(sqlVaciar, [carritoId], (err5) => {
            if (err5) {
              console.error("Error al vaciar carrito tras checkout:", err5);
              return res.status(500).json({ error: "Pedido creado, pero error al vaciar el carrito." });
            }

            // 6) Respuesta OK
            res.json({
              success: true,
              message: "Pedido creado correctamente.",
              pedidoId,
              total
            });
          });
        });
      });
    });
  });
});

// Servidor
const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor en marcha en http://localhost:${PORT}`));
