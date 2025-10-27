/**
 * MfaService - Multi-Factor Authentication Service
 *
 * Handles TOTP-based two-factor authentication operations including:
 * - Secret generation and QR code creation
 * - Token verification
 * - Backup code generation and validation
 * - MFA enable/disable operations
 *
 * Uses speakeasy for TOTP implementation and qrcode for QR code generation.
 *
 * @class MfaService
 */

import crypto from "crypto";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import bcrypt from "bcryptjs";
import {User} from "../../../users/domain/models/User";
import {
  AuthenticationError,
  ValidationError,
} from "../../../../shared/middleware/errorHandler";
import logger from "../../../../shared/infrastructure/logging";
import {cacheService} from "../../../../shared/services/CacheService";

export interface IMfaSetupResult {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface IMfaVerifyResult {
  success: boolean;
  usedBackupCode?: boolean;
}

export class MfaService {
  private readonly APP_NAME = "Sportification";
  private readonly BACKUP_CODES_COUNT = 10;
  private readonly BACKUP_CODE_LENGTH = 8;

  /**
   * Generate MFA secret and QR code for setup
   *
   * Creates a new TOTP secret, generates a QR code for easy scanning,
   * and creates backup codes for account recovery.
   *
   * @param userId - User ID
   * @param email - User email for QR code label
   * @returns Setup data including secret, QR code, and backup codes
   */
  async setupMfa(userId: string, email: string): Promise<IMfaSetupResult> {
    const user = await User.findById(userId).select("+mfaSettings");
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    if (user.mfaSettings?.isEnabled) {
      throw new ValidationError("MFA is already enabled");
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${this.APP_NAME} (${email})`,
      length: 32,
    });

    // Generate QR code
    const qrCode = await qrcode.toDataURL(secret.otpauth_url as string);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    logger.info("MFA setup initiated", {userId});

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Enable MFA after verifying the setup token
   *
   * Verifies the token from the authenticator app, then enables MFA
   * and stores the encrypted secret and backup codes.
   *
   * @param userId - User ID
   * @param secret - TOTP secret (base32 encoded)
   * @param token - 6-digit TOTP token from authenticator app
   * @param backupCodes - Generated backup codes
   * @returns Success indicator
   */
  async enableMfa(
    userId: string,
    secret: string,
    token: string,
    backupCodes: string[]
  ): Promise<{success: boolean}> {
    const user = await User.findById(userId).select("+mfaSettings");
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    if (user.mfaSettings?.isEnabled) {
      throw new ValidationError("MFA is already enabled");
    }

    // Verify the token
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2, // Allow 2 time steps before/after
    });

    if (!isValid) {
      throw new ValidationError("Invalid verification code");
    }

    // Hash backup codes before storing
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, 10))
    );

    // Enable MFA
    user.mfaSettings = {
      isEnabled: true,
      secret,
      backupCodes: hashedBackupCodes,
    };

    await user.save();

    // Invalidate cache
    await cacheService.invalidateMfaStatus(userId);

    logger.info("MFA enabled", {userId});

    return {success: true};
  }

  /**
   * Verify MFA token during login
   *
   * Validates the TOTP token or backup code provided by the user.
   * If a backup code is used, it's removed from the list.
   *
   * @param userId - User ID
   * @param token - 6-digit TOTP token or backup code
   * @returns Verification result
   */
  async verifyMfaToken(
    userId: string,
    token: string
  ): Promise<IMfaVerifyResult> {
    const user = await User.findById(userId).select("+mfaSettings");
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    if (!user.mfaSettings?.isEnabled) {
      throw new ValidationError("MFA is not enabled");
    }

    const secret = user.mfaSettings.secret;
    if (!secret) {
      throw new ValidationError("MFA secret not found");
    }

    // Try verifying as TOTP token first
    const isTotpValid = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2,
    });

    if (isTotpValid) {
      logger.info("MFA token verified", {userId});
      return {success: true, usedBackupCode: false};
    }

    // Try backup codes if TOTP failed
    if (user.mfaSettings.backupCodes && user.mfaSettings.backupCodes.length > 0) {
      for (let i = 0; i < user.mfaSettings.backupCodes.length; i++) {
        const isBackupCodeValid = await bcrypt.compare(
          token,
          user.mfaSettings.backupCodes[i]
        );

        if (isBackupCodeValid) {
          // Remove used backup code
          user.mfaSettings.backupCodes.splice(i, 1);
          await user.save();

          logger.warn("MFA backup code used", {
            userId,
            remainingCodes: user.mfaSettings.backupCodes.length,
          });

          return {success: true, usedBackupCode: true};
        }
      }
    }

    logger.warn("Invalid MFA token attempt", {userId});
    throw new AuthenticationError("Invalid verification code");
  }

  /**
   * Disable MFA for user
   *
   * Requires password confirmation for security.
   *
   * @param userId - User ID
   * @param password - User password for confirmation
   * @returns Success indicator
   */
  async disableMfa(
    userId: string,
    password: string
  ): Promise<{success: boolean}> {
    const user = await User.findById(userId).select("+password +mfaSettings");
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    if (!user.mfaSettings?.isEnabled) {
      throw new ValidationError("MFA is not enabled");
    }

    // Verify password
    if (!user.password) {
      throw new AuthenticationError("Password verification required");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError("Invalid password");
    }

    // Disable MFA
    user.mfaSettings = {
      isEnabled: false,
      secret: undefined,
      backupCodes: [],
    };

    await user.save();

    // Invalidate cache
    await cacheService.invalidateMfaStatus(userId);

    logger.info("MFA disabled", {userId});

    return {success: true};
  }

  /**
   * Regenerate backup codes
   *
   * Generates new backup codes and replaces existing ones.
   * Requires password confirmation.
   *
   * @param userId - User ID
   * @param password - User password for confirmation
   * @returns New backup codes
   */
  async regenerateBackupCodes(
    userId: string,
    password: string
  ): Promise<{backupCodes: string[]}> {
    const user = await User.findById(userId).select("+password +mfaSettings");
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    if (!user.mfaSettings?.isEnabled) {
      throw new ValidationError("MFA is not enabled");
    }

    // Verify password
    if (!user.password) {
      throw new AuthenticationError("Password verification required");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError("Invalid password");
    }

    // Generate new backup codes
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, 10))
    );

    user.mfaSettings.backupCodes = hashedBackupCodes;
    await user.save();

    // Invalidate cache
    await cacheService.invalidateMfaStatus(userId);

    logger.info("MFA backup codes regenerated", {userId});

    return {backupCodes};
  }

  /**
   * Get MFA status for user
   *
   * @param userId - User ID
   * @returns MFA status and backup codes count
   */
  async getMfaStatus(userId: string): Promise<{
    isEnabled: boolean;
    backupCodesCount: number;
  }> {
    // Try cache first
    const cached = await cacheService.getMfaStatus(userId);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const user = await User.findById(userId).select("+mfaSettings");
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const status = {
      isEnabled: user.mfaSettings?.isEnabled || false,
      backupCodesCount: user.mfaSettings?.backupCodes?.length || 0,
    };

    // Cache the result
    await cacheService.cacheMfaStatus(userId, status);

    return status;
  }

  /**
   * Generate random backup codes
   *
   * @private
   * @returns Array of backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];

    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      // Generate random alphanumeric code
      const code = crypto
        .randomBytes(this.BACKUP_CODE_LENGTH)
        .toString("hex")
        .substring(0, this.BACKUP_CODE_LENGTH)
        .toUpperCase();

      codes.push(code);
    }

    return codes;
  }
}
