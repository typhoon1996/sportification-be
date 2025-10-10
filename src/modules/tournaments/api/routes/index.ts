import { Router } from "express";
import { tournamentController } from "../controllers/TournamentController";
import { authenticate } from "../../../../shared/middleware/auth";

const router = Router();

// Tournament routes
router.post("/", authenticate, tournamentController.createTournament);
router.get("/", tournamentController.getTournaments);
router.get("/:id", tournamentController.getTournamentById);
router.post("/:id/join", authenticate, tournamentController.joinTournament);
router.post("/:id/leave", authenticate, tournamentController.leaveTournament);
router.put("/:id/start", authenticate, tournamentController.startTournament);
router.put("/:id", authenticate, tournamentController.updateTournament);
router.delete("/:id", authenticate, tournamentController.deleteTournament);

export default router;
