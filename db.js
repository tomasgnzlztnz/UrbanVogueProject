const mysql = require("mysql2");
require("dotenv").config(); 

// Configuración de la conexión
const connection = mysql.createConnection({
  host:process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "pas123",
  database: process.env.DB_NAME || "tienda_ropa"
});

// Probar conexión
connection.connect((err) => {
  if (err) {
    console.error("Error al conectar con MySQL:", err);
    return;
  }
  console.log("Conexión exitosa con MySQL");
});

module.exports = connection;
