const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

function getRoutes() {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM ruta", (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function addRoute({ origin, destination, schedule }) {
  const id_ruta = uuidv4();

  return new Promise((resolve, reject) => {
    const query = "INSERT INTO ruta (id_ruta, origen, destino, horario) VALUES (?, ?, ?, ?)";
    db.query(query, [id_ruta, origin, destination, schedule], (err) => {
      if (err) return reject(err);
      resolve(id_ruta);
    });
  });
}

module.exports = { getRoutes, addRoute };
