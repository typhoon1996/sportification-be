import {Router} from "express";
import {tournamentController} from "../controllers/TournamentController";
import {authenticate, authorize} from "../../../../shared/middleware/auth";
import {validateRequest} from "../../../../shared/middleware/validation";
import {
  createTournamentValidation,
  idParamValidation,
} from "../../../../shared/validators";
import {body} from "express-validator";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Tournament routes
router.post(
  "/",
  createTournamentValidation,
  validateRequest,
  tournamentController.createTournament
); // Any authenticated user can create

router.get("/", tournamentController.getTournaments); // Any authenticated user can view

router.get(
  "/:id",
  idParamValidation,
  validateRequest,
  tournamentController.getTournamentById
); // Any authenticated user can view

router.post(
  "/:id/join",
  idParamValidation,
  validateRequest,
  tournamentController.joinTournament
); // Any authenticated user can join

router.post(
  "/:id/leave",
  idParamValidation,
  validateRequest,
  tournamentController.leaveTournament
); // Participants can leave

router.put(
  "/:id/start",
  idParamValidation,
  validateRequest,
  tournamentController.startTournament
); // Tournament creator only (checked in controller)

router.put(
  "/:id",
  idParamValidation,
  body("name")
    .optional()
    .trim()
    .isLength({min: 1, max: 100})
    .withMessage("Tournament name must be between 1 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({max: 1000})
    .withMessage("Description cannot exceed 1000 characters"),
  body("status")
    .optional()
    .isIn(["upcoming", "ongoing", "completed", "cancelled"])
    .withMessage("Invalid tournament status"),
  validateRequest,
  tournamentController.updateTournament
); // Tournament creator only (checked in controller)

router.delete(
  "/:id",
  idParamValidation,
  validateRequest,
  authorize(["admin", "moderator"]),
  tournamentController.deleteTournament
); // Admin/moderator only

export default router;
