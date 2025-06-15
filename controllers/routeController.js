const db = require("../config/db");
const axios = require("axios");

// Obtener todas las rutas desde la base de datos
exports.getRoutes = (req, res) => {
  db.query("SELECT * FROM ruta", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

// Calcular ruta entre dos ubicaciones usando API externa
exports.calculateRoute = async (req, res) => {
  const { origin, destination } = req.query;

  if (!origin || !destination) {
    return res.status(400).send("Los parámetros de origen y destino son requeridos");
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const response = await axios.get("https://maps.googleapis.com/maps/api/directions/json", {
      params: {
        origin,
        destination,
        key: apiKey,
      },
    });

    const data = response.data;
    if (data.status !== "OK") {
      return res.status(500).send("Error al calcular la ruta");
    }

    const route = data.routes[0].legs[0];
    res.json({
      distancia: route.distance.text,
      duracion: route.duration.text,
      pasos: route.steps.map(s => s.html_instructions)
    });
  } catch (err) {
    res.status(500).json({ error: "Fallo al contactar con la API de rutas", detail: err.message });
  }
};
