import {Router} from "express";
import {teamController} from "../controllers/TeamController";
import {authenticate, authorize} from "../../../../shared/middleware/auth";
import {validateRequest} from "../../../../shared/middleware/validation";
import {
  createTeamValidation,
  updateTeamValidation,
  idParamValidation,
} from "../../../../shared/validators";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Team routes
router.post(
  "/",
  createTeamValidation,
  validateRequest,
  teamController.createTeam
); // Any authenticated user can create

router.get("/", teamController.getTeams); // Any authenticated user can view

router.get(
  "/:id",
  idParamValidation,
  validateRequest,
  teamController.getTeamById
); // Any authenticated user can view

router.post(
  "/:id/join",
  idParamValidation,
  validateRequest,
  teamController.joinTeam
); // Any authenticated user can join

router.post(
  "/:id/leave",
  idParamValidation,
  validateRequest,
  teamController.leaveTeam
); // Team members can leave

router.put(
  "/:id",
  idParamValidation,
  updateTeamValidation,
  validateRequest,
  teamController.updateTeam
); // Team creator/admin only (checked in controller)

router.delete(
  "/:id",
  idParamValidation,
  validateRequest,
  authorize(["admin", "moderator"]),
  teamController.deleteTeam
); // Admin/moderator only

export default router;
