import {Router} from "express";
import {param} from "express-validator";
import {authenticate} from "../../../../shared/middleware/auth";
import {authLimiter} from "../../../../shared/middleware/security";
import {validateRequest} from "../../../../shared/middleware/validation";
import {sessionController} from "../controllers/SessionController";

const router = Router();

// Apply rate limiting and authentication
router.use(authLimiter);
router.use(authenticate);

/**
 * @swagger
 * /auth/sessions:
 *   get:
 *     summary: Get active sessions
 *     description: List all active sessions for the authenticated user
 *     tags: [Session Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           token:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/sessions", sessionController.getSessions);

/**
 * @swagger
 * /auth/sessions/{sessionId}:
 *   delete:
 *     summary: Revoke specific session
 *     description: Revoke a specific session by ID
 *     tags: [Session Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session revoked successfully
 *       404:
 *         description: Session not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete(
  "/sessions/:sessionId",
  [param("sessionId").notEmpty().withMessage("Session ID is required")],
  validateRequest,
  sessionController.revokeSession
);

/**
 * @swagger
 * /auth/sessions:
 *   delete:
 *     summary: Revoke all sessions
 *     description: Revoke all active sessions for the authenticated user
 *     tags: [Session Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions revoked successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete("/sessions", sessionController.revokeAllSessions);

export default router;
