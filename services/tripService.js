const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

function getTrips() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        v.id_viaje, v.id_conductor, v.estado, v.costo, 
        v.fecha_hora_inicio, v.fecha_hora_fin,
        r.origen, r.destino, r.horario
      FROM viaje v
      JOIN ruta r ON v.id_ruta = r.id_ruta
    `;
    db.query(query, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function addTrip({ driverId, origin, destination, schedule, fare }) {
  const routeId = uuidv4();
  const tripId = uuidv4();

  return new Promise((resolve, reject) => {
    const insertRoute = "INSERT INTO ruta (id_ruta, origen, destino, horario) VALUES (?, ?, ?, ?)";
    db.query(insertRoute, [routeId, origin, destination, schedule], (err) => {
      if (err) return reject(err);

      const insertTrip = `
        INSERT INTO viaje (id_viaje, id_conductor, id_ruta, estado, costo, fecha_hora_inicio)
        VALUES (?, ?, ?, 'esperando', ?, ?)
      `;
      db.query(insertTrip, [tripId, driverId, routeId, fare, schedule], (err) => {
        if (err) return reject(err);
        resolve(tripId);
      });
    });
  });
}

function updateTripStatus(tripId, status) {
  return new Promise((resolve, reject) => {
    const query = "UPDATE viaje SET estado = ? WHERE id_viaje = ?";
    db.query(query, [status, tripId], (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows > 0);
    });
  });
}

module.exports = { getTrips, addTrip, updateTripStatus };
