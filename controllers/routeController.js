const routeService = require("../services/routeService");
const axios = require("axios");

exports.getRoutes = async (req, res) => {
  try {
    const routes = await routeService.getRoutes();
    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

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
