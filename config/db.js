const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 3306,
  
});

connection.connect(err => {
  if (err) console.error("❌ Error conectando a la BD:", err);
  else console.log("✅ Conectado a la base de datos MySQL");
});

module.exports = connection;