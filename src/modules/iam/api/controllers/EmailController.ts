import {Response} from "express";
import {AuthRequest} from "../../../../shared/middleware/auth";
import {
  sendSuccess,
  asyncHandler,
} from "../../../../shared/middleware/errorHandler";
import {EmailService} from "../../domain/services/EmailService";
import {AuditLogger} from "../../../../shared/services/audit";
import logger from "../../../../shared/infrastructure/logging";

/**
 * EmailController - Email Verification and Password Reset Controller
 *
 * Handles all email-related authentication flows:
 * - Email verification
 * - Resend verification
 * - Password reset request
 * - Password reset with token
 *
 * @class EmailController
 */
export class EmailController {
  private readonly emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Verify email with token
   */
  verifyEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {token} = req.params;

    await this.emailService.verifyEmail(token);

    logger.info("Email verified successfully", {token});

    await AuditLogger.logSecurity({
      req,
      action: "email_verified",
      status: "success",
      details: {token},
    });

    sendSuccess(res, null, "Email verified successfully");
  });

  /**
   * Resend verification email
   */
  resendVerification = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {email} = req.body;

    await this.emailService.resendVerificationEmail(email);

    logger.info("Verification email resent", {email});

    sendSuccess(res, null, "Verification email sent");
  });

  /**
   * Request password reset
   */
  forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {email} = req.body;

    await this.emailService.generatePasswordResetToken(email);

    logger.info("Password reset requested", {email});

    await AuditLogger.logSecurity({
      req,
      action: "password_reset_requested",
      status: "success",
      details: {email},
    });

    sendSuccess(res, null, "If the email exists, a password reset link has been sent");
  });

  /**
   * Reset password with token
   */
  resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {token} = req.params;
    const {password} = req.body;

    await this.emailService.resetPassword(token, password);

    logger.info("Password reset successfully", {token});

    await AuditLogger.logSecurity({
      req,
      action: "password_reset_completed",
      status: "success",
      details: {token},
    });

    sendSuccess(res, null, "Password reset successfully");
  });

  /**
   * Validate reset token
   */
  validateResetToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {token} = req.params;

    const result = await this.emailService.validateResetToken(token);

    sendSuccess(res, result);
  });
}

export const emailController = new EmailController();
