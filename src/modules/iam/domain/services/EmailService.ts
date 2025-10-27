/**
 * EmailService - Email Verification and Password Reset
 *
 * Handles email-based authentication flows:
 * - Email verification for new registrations
 * - Password reset tokens and emails
 * - Resending verification emails
 *
 * @class EmailService
 */

import crypto from "crypto";
import {User} from "../../../users/domain/models/User";
import {
  ValidationError,
  NotFoundError,
} from "../../../../shared/middleware/errorHandler";
import logger from "../../../../shared/infrastructure/logging";
import {IamEventPublisher} from "../../events/publishers/IamEventPublisher";
import emailService from "../../../../shared/services/email/EmailService";

export class EmailService {
  private readonly eventPublisher: IamEventPublisher;
  private readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.eventPublisher = new IamEventPublisher();
  }

  /**
   * Generate email verification token
   *
   * @param userId - User ID
   * @returns Verification token
   */
  async generateEmailVerificationToken(userId: string): Promise<string> {
    const user = await User.findById(userId).select("+emailVerificationToken");
    if (!user) {
      throw new NotFoundError("User");
    }

    if (user.isEmailVerified) {
      throw new ValidationError("Email already verified");
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");

    // Store token in database
    user.emailVerificationToken = token;
    await user.save();

    logger.info("Email verification token generated", {userId});

    // Send verification email using shared email service
    const firstName = user.profile?.firstName || user.email.split("@")[0];
    await emailService.sendVerificationEmail(user.email, firstName, token);

    // Publish event for tracking
    this.eventPublisher.publishEmailVerificationRequested({
      userId: user.id,
      email: user.email,
      token,
    });

    return token;
  }

  /**
   * Verify email with token
   *
   * @param token - Verification token
   * @returns Success indicator
   */
  async verifyEmail(token: string): Promise<{success: boolean}> {
    const user = await User.findOne({
      emailVerificationToken: token,
    });

    if (!user) {
      throw new ValidationError("Invalid or expired verification token");
    }

    if (user.isEmailVerified) {
      throw new ValidationError("Email already verified");
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    logger.info("Email verified", {userId: user.id});

    // Publish event
    this.eventPublisher.publishEmailVerified({
      userId: user.id,
      email: user.email,
    });

    return {success: true};
  }

  /**
   * Resend verification email
   *
   * @param email - User email
   * @returns Success indicator
   */
  async resendVerificationEmail(email: string): Promise<{success: boolean}> {
    const user = await User.findByEmail(email);
    if (!user) {
      throw new NotFoundError("User");
    }

    if (user.isEmailVerified) {
      throw new ValidationError("Email already verified");
    }

    // Generate new token
    await this.generateEmailVerificationToken(user.id);

    return {success: true};
  }

  /**
   * Generate password reset token
   *
   * @param email - User email
   * @returns Success indicator
   */
  async generatePasswordResetToken(email: string): Promise<{success: boolean}> {
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      logger.warn("Password reset requested for non-existent email", {email});
      return {success: true};
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + this.TOKEN_EXPIRY);

    // Store token in database
    user.passwordResetToken = token;
    user.passwordResetExpires = expires;
    await user.save();

    logger.info("Password reset token generated", {userId: user.id});

    // Send password reset email using shared email service
    const firstName = user.profile?.firstName || user.email.split("@")[0];
    await emailService.sendPasswordResetEmail(user.email, firstName, token);

    // Publish event for tracking
    this.eventPublisher.publishPasswordResetRequested({
      userId: user.id,
      email: user.email,
      token,
      expiresAt: expires,
    });

    return {success: true};
  }

  /**
   * Reset password with token
   *
   * @param token - Reset token
   * @param newPassword - New password
   * @returns Success indicator
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{success: boolean}> {
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: {$gt: new Date()},
    }).select("+passwordResetToken +passwordResetExpires +password");

    if (!user) {
      throw new ValidationError("Invalid or expired reset token");
    }

    // Import password service for hashing
    const {PasswordService} = await import("./PasswordService");
    const passwordService = new PasswordService();

    // Validate password strength
    const validation = passwordService.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors.join(", "));
    }

    // Hash and update password
    user.password = await passwordService.hashPassword(newPassword);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Invalidate all refresh tokens for security
    user.refreshTokens = [];
    
    await user.save();

    logger.info("Password reset successfully", {userId: user.id});

    // Publish event
    this.eventPublisher.publishPasswordChanged({
      userId: user.id,
      email: user.email,
      timestamp: new Date(),
    });

    return {success: true};
  }

  /**
   * Check if reset token is valid
   *
   * @param token - Reset token
   * @returns Validity status
   */
  async validateResetToken(token: string): Promise<{valid: boolean}> {
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: {$gt: new Date()},
    });

    return {valid: !!user};
  }
}
