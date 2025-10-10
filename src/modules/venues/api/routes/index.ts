import { Router } from "express";
import { venueController } from "../controllers/VenueController";
import { authenticate } from "../../../../shared/middleware/auth";

const router = Router();

// Venue routes
router.post("/", authenticate, venueController.createVenue);
router.get("/", venueController.getVenues);
router.get("/:id", venueController.getVenueById);
router.put("/:id", authenticate, venueController.updateVenue);
router.delete("/:id", authenticate, venueController.deleteVenue);

export default router;
