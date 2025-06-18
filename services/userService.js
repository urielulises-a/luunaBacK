const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// Obtener todos los usuarios
async function getUsers() {
  try {
    const [rows] = await db.query("SELECT * FROM usuario");
    return rows;
  } catch (err) {
    throw err;
  }
}

// Obtener usuario por id
async function getUserById(id) {
  try {
    const [rows] = await db.query("SELECT * FROM usuario WHERE id_usuario = ?", [id]);
    return rows[0];
  } catch (err) {
    throw err;
  }
}

// Agregar usuario (sin hash, guarda password en texto plano)
async function addUser(userData) {
  const { name, email, password, phoneNumber, type, carDetails } = userData;

  try {
    // Verificar si el email ya existe
    const [existing] = await db.query("SELECT * FROM usuario WHERE email = ?", [email]);
    if (existing.length > 0) return false;

    const id_usuario = uuidv4();
    let id_auto = null;

    // Si es conductor, primero insertar el auto
    if (type === "conductor" && carDetails) {
      const { marca, modelo, color, placa, capacidad } = carDetails;
      id_auto = uuidv4();
      await db.query(
        "INSERT INTO auto (id_auto, marca, modelo, color, placa, capacidad) VALUES (?, ?, ?, ?, ?, ?)",
        [id_auto, marca, modelo, color, placa, capacidad]
      );
    }

    // Insertar usuario con el id_auto si aplica
    await db.query(
      "INSERT INTO usuario (id_usuario, nombre, apellido, email, contrasena, telefono, tipo_usuario, id_auto) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id_usuario, name, 'doe', email, password, phoneNumber, type, id_auto]
    );

    return id_usuario;
  } catch (err) {
    throw err;
  }
}


// Verificar usuario comparando password en texto plano
async function verifyUser(email, password) {
  try {
    const [rows] = await db.query("SELECT * FROM usuario WHERE email = ?", [email]);
    if (rows.length === 0) return false;

    const user = rows[0];
    return user.contrasena === password ? user : false;
  } catch (err) {
    throw err;
  }
}

module.exports = { getUsers, getUserById, addUser, verifyUser };
