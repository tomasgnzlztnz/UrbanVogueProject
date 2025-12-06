const mysql = require("mysql2");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config(); 
}

// Configuración de la conexión
console.log("DB_HOST en runtime:", process.env.DB_HOST);
console.log("NODE_ENV en runtime:", process.env.NODE_ENV);
const connection = mysql.createConnection({
  host:process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
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
