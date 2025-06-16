const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const tripService = require("../services/tripService");

exports.getTrips = async (req, res) => {
  try {
    const trips = await tripService.getTrips();
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.addTrip = async (req, res) => {
  try {
    const tripId = await tripService.addTrip(req.body);
    res.status(201).json({ message: "Viaje creado con éxito", tripId });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.updateTripStatus = async (req, res) => {
  const tripId = req.params.id;
  const { status } = req.body;

  try {
    const updated = await tripService.updateTripStatus(tripId, status);
    if (!updated) {
      return res.status(404).json({ message: "Viaje no encontrado" });
    }
    res.status(200).json({ message: "Estado actualizado" });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

// --- Buscar viajes cercanos (por coordenadas aproximadas) ---
exports.findTrips = async (req, res) => {
  try {
    const { origin, maxDistanceKm = 5 } = req.body;

    const [trips] = await db.query(`
      SELECT 
        v.id_viaje, v.id_conductor, v.costo, v.estado,
        -- Extraemos lat y lng de la cadena 'lng,lat'
        CAST(SUBSTRING_INDEX(r.coordenadas_inicio, ',', -1) AS DECIMAL(10, 8)) AS lat_inicio,
        CAST(SUBSTRING_INDEX(r.coordenadas_inicio, ',', 1) AS DECIMAL(11, 8)) AS lng_inicio,
        CAST(SUBSTRING_INDEX(r.coordenadas_fin, ',', -1) AS DECIMAL(10, 8)) AS lat_fin,
        CAST(SUBSTRING_INDEX(r.coordenadas_fin, ',', 1) AS DECIMAL(11, 8)) AS lng_fin
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
