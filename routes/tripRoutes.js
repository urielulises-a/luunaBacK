const express = require("express");
const router = express.Router();
const tripController = require("../controllers/tripController");

router.get("/", tripController.getTrips);
router.post("/addTrip", tripController.addTrip);
router.put("/:id", tripController.updateTripStatus);
router.post("/find", tripController.findTrips);
router.post("/addUserInTrip", tripController.addUserToTrip);
router.delete("/cancelAssistant", tripController.removeUserFromTrip);
router.put("/cancelTrip", tripController.cancelTrip);
router.get("/checkTripStatus", tripController.checkTripStatus);

module.exports = router;
