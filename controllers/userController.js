const db = require("../config/db");
const bcrypt = require("bcrypt");

// Obtener todos los usuarios
exports.getUsers = (req, res) => {
  db.query("SELECT * FROM usuario", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

// Registro de nuevo usuario
exports.registerUser = async (req, res) => {
  const { name, email, password, phoneNumber, type, carDetails } = req.body;

  if (type === "driver" && !carDetails) {
    return res.status(400).json({ message: "Se requiere información del vehículo" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query("SELECT * FROM usuario WHERE correo = ?", [email], (err, rows) => {
    if (err) return res.status(500).json({ error: err });

    if (rows.length > 0) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    db.query(
      "INSERT INTO usuario (nombre, correo, contrasena, telefono, tipo_usuario) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, phoneNumber, type],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });

        const UID = result.insertId;

        if (type === "driver") {
          const { marca, modelo, color, placa } = carDetails;
          db.query(
            "INSERT INTO auto (marca, modelo, color, placa, id_usuario) VALUES (?, ?, ?, ?, ?)",
            [marca, modelo, color, placa, UID],
            (carErr) => {
              if (carErr) return res.status(500).json({ error: carErr });
              res.status(201).json({ message: "Registro exitoso", UID });
            }
          );
        } else {
          res.status(201).json({ message: "Registro exitoso", UID });
        }
      }
    );
  });
};

// Login de usuario
exports.loginUser = (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM usuario WHERE correo = ?", [email], async (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    if (rows.length === 0) return res.status(401).json({ message: "Credenciales inválidas" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.contrasena);

    if (!match) return res.status(401).json({ message: "Credenciales inválidas" });

    res.status(200).json({ message: "Inicio de sesión exitoso", user });
  });
};
