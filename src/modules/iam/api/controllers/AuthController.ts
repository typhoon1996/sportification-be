import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../domain/services/AuthService";
import {
  sendSuccess,
  sendCreated,
  asyncHandler,
} from "../../../../shared/middleware/errorHandler";
import { AuthRequest } from "../../../../shared/middleware/auth";
import { AuditLogger } from "../../../../shared/utils/audit";
import logger from "../../../../shared/utils/logger";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, username } = req.body;

    const result = await this.authService.register(
      email,
      password,
      firstName,
      lastName,
      username
    );

    logger.info(`New user registered: ${email}`, {
      userId: result.user.id,
    });

    // Log audit event
    await AuditLogger.logAuth({
      req,
      action: "registration",
      userId: result.user.id,
      status: "success",
      details: { email, hasProfile: true },
    });

    sendCreated(res, result, "User registered successfully");
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const result = await this.authService.login(email, password);

    // Handle MFA case
    if ("requiresMFA" in result && result.requiresMFA) {
      sendSuccess(res, result, "MFA verification required");
      return;
    }

    logger.info(`User logged in: ${email}`, {
      userId: (result as any).user.id,
    });

    // Log audit event
    await AuditLogger.logAuth({
      req,
      action: "login",
      userId: (result as any).user.id,
      status: "success",
      details: {
        email,
        loginMethod: "password",
      },
    });

    sendSuccess(res, result, "Login successful");
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const result = await this.authService.refreshToken(refreshToken);

    sendSuccess(res, result, "Token refreshed successfully");
  });

  logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;

    await this.authService.logout(req.userId!, refreshToken);

    logger.info(`User logged out: ${req.user.email}`, {
      userId: req.userId,
    });

    // Log audit event
    await AuditLogger.logAuth({
      req,
      action: "logout",
      userId: req.userId!,
      status: "success",
      details: { tokenCleared: !!refreshToken },
    });

    sendSuccess(res, null, "Logout successful");
  });

  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await this.authService.getProfile(req.userId!);

    sendSuccess(res, result);
  });

  changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    await this.authService.changePassword(
      req.userId!,
      currentPassword,
      newPassword
    );

    logger.info(`Password changed for user: ${req.user.email}`, {
      userId: req.userId,
    });

    sendSuccess(
      res,
      null,
      "Password changed successfully. Please log in again."
    );
  });

  deactivateAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { password } = req.body;

    await this.authService.deactivateAccount(req.userId!, password);

    logger.info(`Account deactivated for user: ${req.user.email}`, {
      userId: req.userId,
    });

    sendSuccess(res, null, "Account deactivated successfully");
  });
}

export const authController = new AuthController();
