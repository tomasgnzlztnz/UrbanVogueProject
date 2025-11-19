const path = require("path");
const express = require("express");
const db = require("./db");
const authRoutes = require("./routes/authRoutes");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");

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

// 
// GET - Obtener productos por categoría
app.get("/productos/categoria/:slug", (req, res) => {
  const { slug } = req.params;

  // Mapa de slugs a nombres de categoría en BD
  const mapaCategorias = {
    camisetas: "Camisetas",
    sudaderas: "Sudaderas",
    pantalones: "Pantalones",
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
  // 4) Comprobar si el producto ya está en el carrito
  const sqlBuscarItem = `
    SELECT id, cantidad
    FROM carrito_items
    WHERE id_carrito = ? AND id_producto = ?
    LIMIT 1
  `;

  db.query(sqlBuscarItem, [idCarrito, idProducto], (err, results) => {
    if (err) {
      console.error("Error al buscar item de carrito:", err);
      return res.status(500).json({ error: "Error al buscar el producto en el carrito." });
    }

    if (results.length === 0) {
      // 5) Si no existe → lo insertamos
      const sqlInsertItem = `
        INSERT INTO carrito_items (id_carrito, id_producto, cantidad)
        VALUES (?, ?, ?)
      `;
      db.query(sqlInsertItem, [idCarrito, idProducto, cantidad], (err2) => {
        if (err2) {
          console.error("Error al insertar item en carrito:", err2);
          return res.status(500).json({ error: "Error al añadir el producto al carrito." });
        }

        return res.json({ success: true, message: "Producto añadido al carrito." });
      });
    } else {
      // 6) Si ya existe → sumamos cantidad
      const item = results[0];
      const nuevaCantidad = item.cantidad + cantidad;

      const sqlUpdateItem = `
        UPDATE carrito_items
        SET cantidad = ?
        WHERE id = ?
      `;
      db.query(sqlUpdateItem, [nuevaCantidad, item.id], (err3) => {
        if (err3) {
          console.error("Error al actualizar cantidad en carrito:", err3);
          return res.status(500).json({ error: "Error al actualizar el producto en el carrito." });
        }

        return res.json({ success: true, message: "Cantidad actualizada en el carrito." });
      });
    }
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




// Servidor
const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor en marcha en http://localhost:${PORT}`));
