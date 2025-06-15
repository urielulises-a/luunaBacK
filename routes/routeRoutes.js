const express = require("express");
const router = express.Router();
const routeController = require("../controllers/routeController");

router.get("/", routeController.getRoutes);
router.get("/calculate-route", routeController.calculateRoute);

module.exports = router;
