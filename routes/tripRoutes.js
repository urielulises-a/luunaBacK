const express = require("express");
const router = express.Router();
const tripController = require("../controllers/tripController");

router.get("/", tripController.getTrips);
router.post("/addTrip", tripController.addTrip);
router.put("/:id", tripController.updateTripStatus);

module.exports = router;
