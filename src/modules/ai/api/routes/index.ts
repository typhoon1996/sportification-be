import { Router } from "express";
import { aiController } from "../controllers/AIController";
import { authenticate } from "../../../../shared/middleware/auth";

const router = Router();

// AI routes
router.post("/recommendations", authenticate, aiController.getRecommendations);
router.post("/predictions", authenticate, aiController.getPredictions);
router.post("/insights", authenticate, aiController.getInsights);

export default router;
