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
