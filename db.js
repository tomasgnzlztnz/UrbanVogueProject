// db.js
const mysql = require("mysql2");

// Configuración de la conexión
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "pas123",
  database: "tienda_ropa"
});

// Probar conexión
connection.connect((err) => {
  if (err) {
    console.error("❌ Error al conectar con MySQL:", err);
    return;
  }
  console.log("✅ Conexión exitosa con MySQL");
});

module.exports = connection;
