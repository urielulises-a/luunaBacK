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

function addRoute({ inicio, fin, distancia, tiempo }) {
  const id_ruta = uuidv4();

  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO ruta (id_ruta, coordenadas_inicio, coordenadas_fin, distancia, tiempo_estimado)
      VALUES (?, POINT(?, ?), POINT(?, ?), ?, ?)
    `;
    db.query(
      query,
      [
        id_ruta,
        inicio.lat, inicio.lng,
        fin.lat, fin.lng,
        distancia,
        tiempo // formato: '00:45:00'
      ],
      (err) => {
        if (err) return reject(err);
        resolve(id_ruta);
      }
    );
  });
}

module.exports = { getRoutes, addRoute };
