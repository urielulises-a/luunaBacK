const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// --- Calcular distancia con fórmula de Haversine ---
function toRadians(deg) {
  return deg * (Math.PI / 180);
}
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- Obtener todos los viajes con coordenadas de ruta ---
exports.getTrips = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        v.id_viaje, v.id_conductor, v.estado, v.costo, 
        v.fecha_hora_inicio, v.fecha_hora_fin,
        ST_X(r.coordenadas_inicio) AS lat_inicio,
        ST_Y(r.coordenadas_inicio) AS lng_inicio,
        ST_X(r.coordenadas_fin) AS lat_fin,
        ST_Y(r.coordenadas_fin) AS lng_fin,
        r.distancia, r.tiempo_estimado
      FROM viaje v
      JOIN ruta r ON v.id_ruta = r.id_ruta
    `);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Crear viaje con ruta ---
exports.addTrip = async (req, res) => {
  try {
    const { driverId, origin, destination, schedule, fare } = req.body;
    const routeId = uuidv4();
    const tripId = uuidv4();

    const distance = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);

    // Insertar ruta
    await db.query(
      `INSERT INTO ruta (id_ruta, coordenadas_inicio, coordenadas_fin, distancia, tiempo_estimado)
       VALUES (?, ST_GeomFromText(?), ST_GeomFromText(?), ?, ?)`,
      [
        routeId,
        `POINT(${origin.lat} ${origin.lng})`,
        `POINT(${destination.lat} ${destination.lng})`,
        distance,
        schedule
      ]
    );

    // Insertar viaje
    await db.query(
      `INSERT INTO viaje (id_viaje, id_conductor, id_ruta, estado, costo, fecha_hora_inicio)
       VALUES (?, ?, ?, 'esperando', ?, NOW())`,
      [tripId, driverId, routeId, fare]
    );

    res.status(201).json({ message: "Viaje creado", tripId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Cambiar estado del viaje ---
exports.updateTripStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.query("UPDATE viaje SET estado = ? WHERE id_viaje = ?", [status, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Viaje no encontrado" });
    res.status(200).json({ message: "Estado actualizado" });
  });
};

// --- Buscar viajes cercanos (por coordenadas aproximadas) ---
exports.findTrips = async (req, res) => {
  try {
    const { origin, maxDistanceKm = 5 } = req.body;

    const [trips] = await db.query(`
      SELECT 
        v.id_viaje, v.id_conductor, v.costo, v.estado,
        ST_X(r.coordenadas_inicio) AS lat_inicio,
        ST_Y(r.coordenadas_inicio) AS lng_inicio,
        ST_X(r.coordenadas_fin) AS lat_fin,
        ST_Y(r.coordenadas_fin) AS lng_fin
      FROM viaje v
      JOIN ruta r ON v.id_ruta = r.id_ruta
      WHERE v.estado = 'esperando'
    `);

    const nearby = trips.filter(t => {
      const dist = calculateDistance(origin.lat, origin.lng, t.lat_inicio, t.lng_inicio);
      return dist <= maxDistanceKm;
    });

    res.json(nearby);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Agregar pasajero a viaje ---
exports.addUserToTrip = async (req, res) => {
  try {
    const { tripId, userId } = req.body;

    const [[trip]] = await db.query("SELECT * FROM viaje WHERE id_viaje = ?", [tripId]);
    if (!trip) return res.status(404).json({ error: "Viaje no encontrado" });

    const [[exists]] = await db.query(
      "SELECT * FROM pasajerosviaje WHERE id_viaje = ? AND id_pasajero = ?",
      [tripId, userId]
    );
    if (exists) return res.status(400).json({ error: "Usuario ya registrado" });

    await db.query(
      "INSERT INTO pasajerosviaje (id_viaje, id_pasajero) VALUES (?, ?)",
      [tripId, userId]
    );

    res.status(200).json({ message: "Usuario añadido al viaje" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Eliminar pasajero de viaje ---
exports.removeUserFromTrip = async (req, res) => {
  try {
    const { tripId, userId } = req.body;

    const [[exists]] = await db.query(
      "SELECT * FROM pasajerosviaje WHERE id_viaje = ? AND id_pasajero = ?",
      [tripId, userId]
    );
    if (!exists)
      return res.status(404).json({ error: "Usuario no está en el viaje" });

    await db.query(
      "DELETE FROM pasajerosviaje WHERE id_viaje = ? AND id_pasajero = ?",
      [tripId, userId]
    );

    res.status(200).json({ message: "Usuario eliminado del viaje" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Cancelar viaje ---
exports.cancelTrip = async (req, res) => {
  try {
    const { tripId } = req.body;

    const [result] = await db.query(
      "UPDATE viaje SET estado = 'cancelado' WHERE id_viaje = ?",
      [tripId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Viaje no encontrado" });

    res.status(200).json({ message: "Viaje cancelado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Consultar estado del viaje ---
exports.checkTripStatus = async (req, res) => {
  try {
    const { tripId } = req.query;

    const [[trip]] = await db.query("SELECT estado FROM viaje WHERE id_viaje = ?", [tripId]);
    if (!trip) return res.status(404).json({ error: "Viaje no encontrado" });

    res.status(200).json({ status: trip.estado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
