/**
 * SessionService - Session Management Service
 *
 * Handles user session tracking and management:
 * - List active sessions
 * - Revoke specific sessions
 * - Revoke all sessions
 *
 * Sessions are tracked via refresh tokens stored in the User model.
 *
 * @class SessionService
 */

import {User} from "../../../users/domain/models/User";
import {
  AuthenticationError,
  NotFoundError,
} from "../../../../shared/middleware/errorHandler";
import logger from "../../../../shared/infrastructure/logging";

export interface ISession {
  id: string;
  token: string;
  createdAt?: Date;
  lastUsed?: Date;
}

export interface ISessionListResult {
  sessions: ISession[];
  count: number;
}

export class SessionService {
  /**
   * Get all active sessions for a user
   *
   * @param userId - User ID
   * @returns List of active sessions
   */
  async getSessions(userId: string): Promise<ISessionListResult> {
    const user = await User.findById(userId).select("+refreshTokens");
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const sessions: ISession[] = (user.refreshTokens || []).map((token, index) => ({
      id: `${index}`,
      token: token.substring(0, 20) + "...", // Partial token for display
      createdAt: user.createdAt,
      lastUsed: user.lastLoginAt,
    }));

    return {
      sessions,
      count: sessions.length,
    };
  }

  /**
   * Revoke a specific session
   *
   * @param userId - User ID
   * @param sessionId - Session ID (index in refreshTokens array)
   * @returns Success indicator
   */
  async revokeSession(userId: string, sessionId: string): Promise<{success: boolean}> {
    const user = await User.findById(userId).select("+refreshTokens");
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const sessionIndex = parseInt(sessionId, 10);
    if (isNaN(sessionIndex) || sessionIndex < 0 || sessionIndex >= (user.refreshTokens || []).length) {
      throw new NotFoundError("Session");
    }

    // Remove the specific refresh token
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.splice(sessionIndex, 1);
    await user.save();

    logger.info("Session revoked", {userId, sessionId});

    return {success: true};
  }

  /**
   * Revoke all sessions for a user
   *
   * @param userId - User ID
   * @returns Success indicator
   */
  async revokeAllSessions(userId: string): Promise<{success: boolean}> {
    const user = await User.findById(userId).select("+refreshTokens");
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const sessionCount = (user.refreshTokens || []).length;

    // Clear all refresh tokens
    user.refreshTokens = [];
    await user.save();

    logger.info("All sessions revoked", {userId, count: sessionCount});

    return {success: true};
  }
}
