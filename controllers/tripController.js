const db = require("../config/db");

// Obtener todos los viajes
exports.getTrips = (req, res) => {
  const query = `
    SELECT v.id, v.id_usuario AS driverId, v.estado, v.tarifa, v.num_pasajeros,
           r.origen, r.destino, r.horario
    FROM viaje v
    JOIN ruta r ON v.id_ruta = r.id
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

// Crear nuevo viaje con ruta asociada
exports.addTrip = (req, res) => {
  const { driverId, passengerCount, fare, origin, destination, schedule } = req.body;

  // Primero crear la ruta
  const insertRoute = "INSERT INTO ruta (origen, destino, horario) VALUES (?, ?, ?)";
  db.query(insertRoute, [origin, destination, schedule], (err, routeResult) => {
    if (err) return res.status(500).json({ error: "Error creando ruta", detail: err });

    const routeId = routeResult.insertId;

    // Luego crear el viaje
    const insertTrip = `
      INSERT INTO viaje (id_usuario, id_ruta, num_pasajeros, tarifa, estado)
      VALUES (?, ?, ?, ?, 'pendiente')
    `;
    db.query(insertTrip, [driverId, routeId, passengerCount, fare], (err, tripResult) => {
      if (err) return res.status(500).json({ error: "Error creando viaje", detail: err });

      res.status(201).json({
        message: "Viaje confirmado con éxito",
        tripId: tripResult.insertId
      });
    });
  });
};

// Actualizar estado de viaje
exports.updateTripStatus = (req, res) => {
  const tripId = parseInt(req.params.id, 10);
  const { status } = req.body;

  const updateQuery = "UPDATE viaje SET estado = ? WHERE id = ?";
  db.query(updateQuery, [status, tripId], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Viaje no encontrado" });

    res.status(200).json({ message: "Estado del viaje actualizado" });
  });
};
