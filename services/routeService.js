const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

async function getRoutes() {
  try {
    const [rows] = await db.query("SELECT * FROM ruta");
    return rows;
  } catch (err) {
    throw err;
  }
}

async function addRoute({ inicio, fin, distancia, tiempo }) {
  const id_ruta = uuidv4();

  const query = `
    INSERT INTO ruta (id_ruta, coordenadas_inicio, coordenadas_fin, distancia, tiempo_estimado)
    VALUES (?, POINT(?, ?), POINT(?, ?), ?, ?)
  `;
  try {
    await db.query(query, [
      id_ruta,
      inicio.lat, inicio.lng,
      fin.lat, fin.lng,
      distancia,
      tiempo, // formato: '00:45:00'
    ]);
    return id_ruta;
  } catch (err) {
    throw err;
  }
}

module.exports = { getRoutes, addRoute };
