import {Response} from "express";
import {AuthRequest} from "../../../../shared/middleware/auth";
import {
  sendSuccess,
  sendCreated,
  asyncHandler,
} from "../../../../shared/middleware/errorHandler";
import {MfaService} from "../../domain/services/MfaService";
import {AuditLogger} from "../../../../shared/services/audit";
import logger from "../../../../shared/infrastructure/logging";

/**
 * MfaController - Multi-Factor Authentication Controller
 *
 * Handles all MFA-related HTTP requests including:
 * - MFA setup and enabling
 * - Token verification during login
 * - MFA disabling
 * - Backup code management
 *
 * All endpoints require authentication except verify-login which is used during login flow.
 *
 * @class MfaController
 */
export class MfaController {
  private readonly mfaService: MfaService;

  constructor() {
    this.mfaService = new MfaService();
  }

  /**
   * Setup MFA for the authenticated user
   *
   * Generates a new TOTP secret, QR code, and backup codes.
   * User must verify the setup by providing a token in the enable endpoint.
   *
   * @async
   * @param {AuthRequest} req - Authenticated request
   * @param {Response} res - Express response
   * @returns {Promise<void>} 200 OK with setup data
   *
   * @example
   * GET /api/v1/auth/mfa/setup
   * Headers: { Authorization: "Bearer <token>" }
   *
   * Response: {
   *   success: true,
   *   data: {
   *     secret: "BASE32ENCODEDSECRET",
   *     qrCode: "data:image/png;base64,...",
   *     backupCodes: ["ABCD1234", "EFGH5678", ...]
   *   },
   *   message: "Scan QR code with your authenticator app"
   * }
   */
  setup = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await this.mfaService.setupMfa(req.userId, req.user.email);

    await AuditLogger.logSecurity({
      req,
      action: "mfa_setup_initiated",
      userId: req.userId,
      status: "success",
      details: {email: req.user.email},
    });

    sendSuccess(
      res,
      result,
      "Scan the QR code with your authenticator app and verify with a code"
    );
  });

  /**
   * Enable MFA after verification
   *
   * Verifies the TOTP token from the authenticator app and enables MFA.
   * Stores the encrypted secret and backup codes.
   *
   * @async
   * @param {AuthRequest} req - Authenticated request with secret, token, backupCodes
   * @param {Response} res - Express response
   * @returns {Promise<void>} 200 OK on success
   *
   * @throws {ValidationError} If token is invalid or MFA already enabled
   *
   * @example
   * POST /api/v1/auth/mfa/enable
   * Headers: { Authorization: "Bearer <token>" }
   * Body: {
   *   secret: "BASE32SECRET",
   *   token: "123456",
   *   backupCodes: ["ABCD1234", ...]
   * }
   */
  enable = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {secret, token, backupCodes} = req.body;

    await this.mfaService.enableMfa(req.userId, secret, token, backupCodes);

    logger.info("MFA enabled successfully", {
      userId: req.userId,
      email: req.user.email,
    });

    await AuditLogger.logSecurity({
      req,
      action: "mfa_enabled",
      userId: req.userId,
      status: "success",
      details: {email: req.user.email},
    });

    sendSuccess(res, null, "Two-factor authentication enabled successfully");
  });

  /**
   * Verify MFA token during login
   *
   * Called during the login flow when MFA is required.
   * Validates the TOTP token or backup code.
   *
   * @async
   * @param {AuthRequest} req - Request with userId and token
   * @param {Response} res - Express response
   * @returns {Promise<void>} 200 OK with verification result
   *
   * @throws {AuthenticationError} If token is invalid
   *
   * @example
   * POST /api/v1/auth/mfa/verify
   * Body: {
   *   userId: "507f1f77bcf86cd799439011",
   *   token: "123456"
   * }
   */
  verify = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {userId, token} = req.body;

    const result = await this.mfaService.verifyMfaToken(userId, token);

    await AuditLogger.logSecurity({
      req,
      action: result.usedBackupCode
        ? "mfa_backup_code_used"
        : "mfa_login_success",
      userId,
      status: "success",
      details: {usedBackupCode: result.usedBackupCode},
    });

    sendSuccess(
      res,
      {verified: true, usedBackupCode: result.usedBackupCode},
      "Verification successful"
    );
  });

  /**
   * Disable MFA
   *
   * Disables MFA for the authenticated user.
   * Requires password confirmation for security.
   *
   * @async
   * @param {AuthRequest} req - Authenticated request with password
   * @param {Response} res - Express response
   * @returns {Promise<void>} 200 OK on success
   *
   * @throws {AuthenticationError} If password is incorrect
   * @throws {ValidationError} If MFA is not enabled
   *
   * @example
   * POST /api/v1/auth/mfa/disable
   * Headers: { Authorization: "Bearer <token>" }
   * Body: { password: "SecurePass123!" }
   */
  disable = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {password} = req.body;

    await this.mfaService.disableMfa(req.userId, password);

    logger.info("MFA disabled", {
      userId: req.userId,
      email: req.user.email,
    });

    await AuditLogger.logSecurity({
      req,
      action: "mfa_disabled",
      userId: req.userId,
      status: "success",
      details: {email: req.user.email},
    });

    sendSuccess(res, null, "Two-factor authentication disabled successfully");
  });

  /**
   * Regenerate backup codes
   *
   * Generates new backup codes and replaces existing ones.
   * Requires password confirmation.
   *
   * @async
   * @param {AuthRequest} req - Authenticated request with password
   * @param {Response} res - Express response
   * @returns {Promise<void>} 200 OK with new backup codes
   *
   * @throws {AuthenticationError} If password is incorrect
   * @throws {ValidationError} If MFA is not enabled
   *
   * @example
   * POST /api/v1/auth/mfa/backup-codes
   * Headers: { Authorization: "Bearer <token>" }
   * Body: { password: "SecurePass123!" }
   */
  regenerateBackupCodes = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const {password} = req.body;

      const result = await this.mfaService.regenerateBackupCodes(
        req.userId,
        password
      );

      logger.info("MFA backup codes regenerated", {
        userId: req.userId,
      });

      await AuditLogger.logSecurity({
        req,
        action: "mfa_backup_codes_regenerated",
        userId: req.userId,
        status: "success",
        details: {codesCount: result.backupCodes.length},
      });

      sendSuccess(
        res,
        result,
        "Backup codes regenerated. Store them securely."
      );
    }
  );

  /**
   * Get MFA status
   *
   * Returns current MFA status and backup codes count.
   *
   * @async
   * @param {AuthRequest} req - Authenticated request
   * @param {Response} res - Express response
   * @returns {Promise<void>} 200 OK with MFA status
   *
   * @example
   * GET /api/v1/auth/mfa/status
   * Headers: { Authorization: "Bearer <token>" }
   */
  getStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await this.mfaService.getMfaStatus(req.userId);

    sendSuccess(res, result);
  });
}

export const mfaController = new MfaController();
