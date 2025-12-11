if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

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
const { sendContactFormEmail } = require("./mailer");
const SHIPPING_THRESHOLD = 50;
const SHIPPING_COST = 3.99;



const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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
      secure: false,
      maxAge: 1000 * 60 * 60 * 2
    }
  })
);


app.use(express.static(path.join(__dirname, 'app')));


app.use('/api/auth', authRoutes);

app.use('/api/user', userRoutes);

app.use('/api/admin', adminRoutes);


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


app.get("/productos/rebajas", (req, res) => {

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
        return res.status(500).json({ error: "Error al obtener productos de rebajas." });
      }

      resultados.push({
        categoria: nombreCat,
        productos: rows
      });

      pendientes--;


      if (pendientes === 0) {
        res.json(resultados);
      }
    });
  });
});


app.get("/productos/destacados", (req, res) => {

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


      const tallaFinal = tallaSeleccionada && tallaSeleccionada.trim() !== ""
        ? tallaSeleccionada.trim()
        : "M";

      if (results.length === 0) {

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


app.get("/api/cart", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "No has iniciado sesión." });
  }

  const userId = req.session.user.id;


  const sqlCarrito = "SELECT id FROM carrito WHERE id_usuario = ? LIMIT 1";

  db.query(sqlCarrito, [userId], (err, results) => {
    if (err) {
      console.error("Error al buscar carrito:", err);
      return res.status(500).json({ error: "Error al buscar el carrito." });
    }

    if (results.length === 0) {

      return res.json({
        items: [],
        subtotal: 0,
        shippingCost: 0,
        total: 0,
      });
    }

    const carritoId = results[0].id;


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
        return res
          .status(500)
          .json({ error: "Error al obtener los productos del carrito." });
      }


      const subtotal = rows.reduce(
        (sum, item) => sum + Number(item.total_linea),
        0
      );


      const shippingCost =
        subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;


      const total = subtotal + shippingCost;

      return res.json({
        items: rows,
        subtotal,
        shippingCost,
        total,
      });
    });
  });
});


app.delete("/api/cart/item/:itemId", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "No has iniciado sesión." });
  }

  const userId = req.session.user.id;
  const itemId = req.params.itemId;


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


app.post("/api/cart/item/:itemId/decrement", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "No has iniciado sesión." });
  }

  const userId = req.session.user.id;
  const itemId = req.params.itemId;


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


app.post("/api/cart/clear", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "No has iniciado sesión." });
  }

  const userId = req.session.user.id;


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


app.post("/api/cart/checkout", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "No has iniciado sesión." });
  }

  const userId = req.session.user.id;
  const userEmail = req.session.user.email;
  const userNombre = req.session.user.nombre;


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


    const sqlItems = `
      SELECT 
        ci.id           AS item_id,
        p.id            AS product_id,
        p.nombre        AS nombre,
        p.precio        AS precio,
        ci.cantidad     AS cantidad,
        ci.talla        AS talla
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


      const subtotal = items.reduce(
        (sum, it) => sum + Number(it.precio) * it.cantidad,
        0
      );


      const shippingCost =
        subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;


      const total = subtotal + shippingCost;


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


        const sqlDetalle = `
          INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, talla, precio_unitario)
          VALUES ?
        `;

        const values = items.map((it) => [
          pedidoId,
          it.product_id,
          it.cantidad,
          it.talla || "M",
          it.precio,
        ]);

        db.query(sqlDetalle, [values], (err4) => {
          if (err4) {
            console.error("Error al insertar detalle del pedido:", err4);
            return res
              .status(500)
              .json({ error: "Error al crear el detalle del pedido." });
          }


          const sqlVaciar = "DELETE FROM carrito_items WHERE id_carrito = ?";

          db.query(sqlVaciar, [carritoId], (err5) => {
            if (err5) {
              console.error("Error al vaciar carrito tras checkout:", err5);
              return res.status(500).json({
                error: "Pedido creado, pero error al vaciar el carrito.",
              });
            }


            if (userEmail) {
              sendOrderConfirmationEmail({
                to: userEmail,
                nombre: userNombre,
                pedidoId,
                total,
                subtotal,
                shippingCost,
                items: items.map((it) => ({
                  nombre: it.nombre,
                  cantidad: it.cantidad,
                  talla: it.talla || "M",
                  precio: it.precio,
                })),
              }).catch((emailErr) => {
                console.error(
                  "Error al enviar el correo de confirmación:",
                  emailErr
                );

              });
            } else {
              console.warn(
                "Usuario sin email, no se envía correo de confirmación."
              );
            }


            res.json({
              success: true,
              message: "Pedido creado correctamente.",
              pedidoId,
              total,
              subtotal,
              shippingCost,
            });
          });
        });
      });
    });
  });
});



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

    res.json(rows);
  });
});



app.get("/api/search", (req, res) => {
  const q = (req.query.q || "").trim();


  if (q.length === 0) {
    return res.json({
      success: true,
      results: []
    });
  }


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



app.post("/api/newsletter/subscribe", (req, res) => {
  const { email } = req.body;


  if (!email || typeof email !== "string") {
    return res.status(400).json({
      success: false,
      message: "Debes indicar un correo electrónico."
    });
  }

  const emailLimpio = email.trim().toLowerCase();


  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLimpio)) {
    return res.status(400).json({
      success: false,
      message: "El formato del correo no es válido."
    });
  }


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

      return res.json({
        success: true,
        message: "Este correo ya estaba suscrito a las novedades."
      });
    }


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


      (async () => {
        try {
          await sendNewsletterWelcomeEmail(emailLimpio);
        } catch (errMail) {
          console.error("Error enviando email de newsletter:", errMail);

        }
      })();

      return res.status(201).json({
        success: true,
        message: "Te has suscrito correctamente a las novedades."
      });
    });
  });
});


app.post("/api/contacto", async (req, res) => {
  const { nombre, email, asunto, mensaje } = req.body || {};

  if (!nombre || !email || !mensaje) {
    return res.status(400).json({
      success: false,
      message: "Nombre, email y mensaje son obligatorios."
    });
  }

  try {
    await sendContactFormEmail({ nombre, email, asunto, mensaje });
    res.json({
      success: true,
      message: "Mensaje enviado correctamente."
    });
  } catch (err) {
    console.error("Error enviando correo de contacto:", err);
    res.status(500).json({
      success: false,
      message: "No se pudo enviar el mensaje. Inténtalo de nuevo más tarde."
    });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en marcha en http://localhost:${PORT}`));
