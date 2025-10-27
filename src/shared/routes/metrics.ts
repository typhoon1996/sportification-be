import {Router, Request, Response} from "express";
import {asyncHandler, sendSuccess} from "../../middleware/errorHandler";
import {metricsService} from "../services/MetricsService";
import {authenticate} from "../../middleware/auth";
import {authorize} from "../../middleware/auth";

const router = Router();

/**
 * @swagger
 * /metrics/summary:
 *   get:
 *     summary: Get metrics summary
 *     description: Get comprehensive metrics summary (admin only)
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  "/summary",
  authenticate,
  authorize(["admin"]),
  asyncHandler(async (req: Request, res: Response) => {
    const summary = await metricsService.getMetricsSummary();
    sendSuccess(res, summary);
  })
);

/**
 * @swagger
 * /metrics/prometheus:
 *   get:
 *     summary: Export metrics in Prometheus format
 *     description: Export all metrics in Prometheus exposition format
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Prometheus metrics
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get(
  "/prometheus",
  asyncHandler(async (req: Request, res: Response) => {
    const metrics = await metricsService.exportPrometheusMetrics();
    res.set("Content-Type", "text/plain");
    res.send(metrics);
  })
);

export default router;
