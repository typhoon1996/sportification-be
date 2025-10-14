import {Router} from "express";
import {venueController} from "../controllers/VenueController";
import {authenticate, authorize} from "../../../../shared/middleware/auth";
import {validateRequest} from "../../../../shared/middleware/validation";
import {
  createVenueValidation,
  idParamValidation,
} from "../../../../shared/validators";
import bookingRoutes from "./bookings";

const router = Router();

// Booking routes - mounted at /bookings (has its own auth)
router.use("/bookings", bookingRoutes);

// All venue routes require authentication
router.use(authenticate);

// Venue routes
router.post(
  "/",
  authorize(["admin", "moderator"]),
  createVenueValidation,
  validateRequest,
  venueController.createVenue
); // Admin/moderator only

router.get("/", venueController.getVenues); // Any authenticated user can view

router.get(
  "/:id",
  idParamValidation,
  validateRequest,
  venueController.getVenueById
); // Any authenticated user can view

router.put(
  "/:id",
  idParamValidation,
  authorize(["admin", "moderator"]),
  createVenueValidation,
  validateRequest,
  venueController.updateVenue
); // Admin/moderator only

router.delete(
  "/:id",
  idParamValidation,
  validateRequest,
  authorize(["admin"]),
  venueController.deleteVenue
); // Admin only

export default router;
