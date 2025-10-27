import {Response} from "express";
import {AuthRequest} from "../../../../shared/middleware/auth";
import {
  sendSuccess,
  asyncHandler,
} from "../../../../shared/middleware/errorHandler";
import {SessionService} from "../../domain/services/SessionService";
import {AuditLogger} from "../../../../shared/services/audit";
import logger from "../../../../shared/infrastructure/logging";

/**
 * SessionController - Session Management Controller
 *
 * Handles user session management:
 * - List active sessions
 * - Revoke specific session
 * - Revoke all sessions
 *
 * @class SessionController
 */
export class SessionController {
  private readonly sessionService: SessionService;

  constructor() {
    this.sessionService = new SessionService();
  }

  /**
   * Get all active sessions
   */
  getSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await this.sessionService.getSessions(req.userId);

    sendSuccess(res, result);
  });

  /**
   * Revoke a specific session
   */
  revokeSession = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {sessionId} = req.params;

    await this.sessionService.revokeSession(req.userId, sessionId);

    logger.info("Session revoked", {userId: req.userId, sessionId});

    await AuditLogger.logSecurity({
      req,
      action: "session_revoked",
      userId: req.userId,
      status: "success",
      details: {sessionId},
    });

    sendSuccess(res, null, "Session revoked successfully");
  });

  /**
   * Revoke all sessions
   */
  revokeAllSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
    await this.sessionService.revokeAllSessions(req.userId);

    logger.info("All sessions revoked", {userId: req.userId});

    await AuditLogger.logSecurity({
      req,
      action: "all_sessions_revoked",
      userId: req.userId,
      status: "success",
    });

    sendSuccess(res, null, "All sessions revoked successfully");
  });
}

export const sessionController = new SessionController();
