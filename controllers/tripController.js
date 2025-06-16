const db = require("../config/db");

// Obtener todos los viajes con sus rutas
exports.getTrips = (req, res) => {
  const query = `
    SELECT 
      v.id_viaje, v.id_conductor, v.estado, v.costo, 
      v.fecha_hora_inicio, v.fecha_hora_fin,
      r.origen, r.destino, r.horario
    FROM viaje v
    JOIN ruta r ON v.id_ruta = r.id_ruta
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

// Crear nuevo viaje con ruta asociada
exports.addTrip = (req, res) => {
  const { driverId, origin, destination, schedule, fare } = req.body;

  const insertRoute = `
    INSERT INTO ruta (origen, destino, horario)
    VALUES (?, ?, ?)
  `;

  db.query(insertRoute, [origin, destination, schedule], (err, routeResult) => {
    if (err) return res.status(500).json({ error: "Error creando ruta", detail: err });

    const getRouteId = `
      SELECT id_ruta FROM ruta WHERE origen = ? AND destino = ? AND horario = ?
      ORDER BY id_ruta DESC LIMIT 1
    `;

    db.query(getRouteId, [origin, destination, schedule], (err, routeRows) => {
      if (err || routeRows.length === 0) {
        return res.status(500).json({ error: "No se pudo recuperar la ruta", detail: err });
      }

      const routeId = routeRows[0].id_ruta;

      const insertTrip = `
        INSERT INTO viaje (id_conductor, id_ruta, estado, costo, fecha_hora_inicio)
        VALUES (?, ?, 'esperando', ?, ?)
      `;

      db.query(insertTrip, [driverId, routeId, fare, schedule], (err, tripResult) => {
        if (err) return res.status(500).json({ error: "Error creando viaje", detail: err });

        res.status(201).json({
          message: "Viaje confirmado con éxito",
          tripId: tripResult.insertId // Nota: insertId será 0 si no es auto_increment
        });
      });
    });
  });
};

// Actualizar estado del viaje
exports.updateTripStatus = (req, res) => {
  const tripId = req.params.id;
  const { status } = req.body;

  const updateQuery = "UPDATE viaje SET estado = ? WHERE id_viaje = ?";
  db.query(updateQuery, [status, tripId], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Viaje no encontrado" });

    res.status(200).json({ message: "Estado del viaje actualizado" });
  });
};
