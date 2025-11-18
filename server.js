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

// Servidor
const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor en marcha en http://localhost:${PORT}`));
