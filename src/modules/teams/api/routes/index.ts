import { Router } from "express";
import { teamController } from "../controllers/TeamController";
import { authenticate } from "../../../../shared/middleware/auth";

const router = Router();

// Team routes
router.post("/", authenticate, teamController.createTeam);
router.get("/", teamController.getTeams);
router.get("/:id", teamController.getTeamById);
router.post("/:id/join", authenticate, teamController.joinTeam);
router.post("/:id/leave", authenticate, teamController.leaveTeam);
router.put("/:id", authenticate, teamController.updateTeam);
router.delete("/:id", authenticate, teamController.deleteTeam);

export default router;
