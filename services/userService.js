const db = require("../config/db");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

async function getUsers() {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM usuario", (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM usuario WHERE id_usuario = ?", [id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows[0]);
    });
  });
}

async function addUser(userData) {
  const { name, email, password, phoneNumber, type, carDetails } = userData;

  return new Promise(async (resolve, reject) => {
    db.query("SELECT * FROM usuario WHERE correo = ?", [email], async (err, rows) => {
      if (err) return reject(err);
      if (rows.length > 0) return resolve(false);

      const id_usuario = uuidv4();
      const hashedPassword = await bcrypt.hash(password, 10);

      db.query(
        "INSERT INTO usuario (id_usuario, nombre, correo, contrasena, telefono, tipo_usuario) VALUES (?, ?, ?, ?, ?, ?)",
        [id_usuario, name, email, hashedPassword, phoneNumber, type],
        (err) => {
          if (err) return reject(err);

          if (type === "driver" && carDetails) {
            const { marca, modelo, color, placa } = carDetails;
            const id_auto = uuidv4();
            db.query(
              "INSERT INTO auto (id_auto, marca, modelo, color, placa, id_usuario) VALUES (?, ?, ?, ?, ?, ?)",
              [id_auto, marca, modelo, color, placa, id_usuario],
              (carErr) => {
                if (carErr) return reject(carErr);
                resolve(id_usuario);
              }
            );
          } else {
            resolve(id_usuario);
          }
        }
      );
    });
  });
}

async function verifyUser(email, password) {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM usuario WHERE correo = ?", [email], async (err, rows) => {
      if (err) return reject(err);
      if (rows.length === 0) return resolve(false);

      const user = rows[0];
      const match = await bcrypt.compare(password, user.contrasena);
      resolve(match ? user : false);
    });
  });
}

module.exports = { getUsers, getUserById, addUser, verifyUser };
