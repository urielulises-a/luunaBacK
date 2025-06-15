const express = require("express");
const cors = require("cors");
require("dotenv").config();

const usuarioRoutes = require("./routes/userRoutes");
const tripRoutes = require("./routes/tripRoutes");
const routeRoutes = require("./routes/routeRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Rutas principales
app.use("/usuarios", usuarioRoutes);
app.use("/viajes", tripRoutes);
app.use("/rutas", routeRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
