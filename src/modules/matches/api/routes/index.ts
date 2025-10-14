import {Router} from "express";
import {matchController} from "../controllers/MatchController";
import {authenticate, authorize} from "../../../../shared/middleware/auth";
import {validateRequest} from "../../../../shared/middleware/validation";
import {
  createMatchValidation,
  idParamValidation,
} from "../../../../shared/validators";
import {body} from "express-validator";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Match routes
router.post(
  "/",
  createMatchValidation,
  validateRequest,
  matchController.createMatch
); // Any authenticated user can create

router.get("/", matchController.getMatches); // Any authenticated user can view

router.get(
  "/:id",
  idParamValidation,
  validateRequest,
  matchController.getMatchById
); // Any authenticated user can view

router.post(
  "/:id/join",
  idParamValidation,
  validateRequest,
  matchController.joinMatch
); // Any authenticated user can join

router.post(
  "/:id/leave",
  idParamValidation,
  validateRequest,
  matchController.leaveMatch
); // Any authenticated user can leave

router.put(
  "/:id/score",
  idParamValidation,
  body("scores").optional().isObject().withMessage("Scores must be an object"),
  body("winner")
    .optional()
    .isMongoId()
    .withMessage("Winner must be a valid user ID"),
  validateRequest,
  matchController.updateScore
); // Match creator or participants

router.put(
  "/:id/status",
  idParamValidation,
  body("status")
    .isIn(["upcoming", "ongoing", "completed", "expired", "cancelled"])
    .withMessage("Invalid match status"),
  validateRequest,
  matchController.updateMatchStatus
); // Match creator only

router.delete(
  "/:id",
  idParamValidation,
  validateRequest,
  authorize(["admin", "moderator"]),
  matchController.deleteMatch
); // Admin/moderator only

export default router;
