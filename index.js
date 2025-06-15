const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const connection = mysql.createConnection({
  host: process.env.DB_HOST,       // ej. 'mi-servidor.com'
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 3306
});

connection.connect(err => {
  if (err) {
    console.error("Error de conexión a MySQL:", err);
  } else {
    console.log("✅ Conectado a MySQL");
  }
});

// Ruta de prueba
app.get("/usuarios", (req, res) => {
  connection.query("SELECT * FROM usuario", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend escuchando en puerto ${PORT}`);
});
