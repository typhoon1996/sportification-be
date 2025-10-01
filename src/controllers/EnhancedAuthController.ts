import { Request, Response } from 'express';
import { User } from '../models/User';
import { JWTUtil } from '../utils/jwt';
import { MFAUtil, SecurityUtil } from '../utils/security';
import {
  ValidationError,
  AuthenticationError,
  ConflictError,
  ForbiddenError,
  sendSuccess,
  asyncHandler,
} from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class EnhancedAuthController {
  // Setup MFA
  static setupMFA = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user;

    if (user.mfaSettings?.isEnabled) {
      throw new ConflictError('MFA is already enabled for this account');
    }

    // Generate secret and QR code
    const { secret, qrCodeUrl } = MFAUtil.generateSecret(user.email);
    const qrCodeImage = await MFAUtil.generateQRCode(qrCodeUrl);

    // Temporarily store secret (not saved to DB until verified)
    sendSuccess(
      res,
      {
        secret,
        qrCode: qrCodeImage,
        backupCodes: null, // Will be provided after verification
      },
      'MFA setup initiated. Please verify with your authenticator app.'
    );
  });

  // Verify and enable MFA
  static verifyMFA = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { secret, token } = req.body;
    const user = req.user;

    if (!secret || !token) {
      throw new ValidationError('Secret and verification token are required');
    }

    // Verify the token
    const isValid = MFAUtil.verifyToken(secret, token);
    if (!isValid) {
      throw new AuthenticationError('Invalid verification token');
    }

    // Generate backup codes
    const backupCodes = MFAUtil.generateBackupCodes();

    // Enable MFA for user
    user.mfaSettings = {
      isEnabled: true,
      secret,
      backupCodes,
      lastUsedAt: new Date(),
    };
    await user.save();

    logger.info(`MFA enabled for user: ${user.email}`, { userId: user.id });

    sendSuccess(
      res,
      {
        backupCodes,
        message: 'MFA enabled successfully. Save these backup codes securely!',
      },
      'MFA has been enabled for your account'
    );
  });

  // Disable MFA
  static disableMFA = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { password, token } = req.body;
    const user = req.user;

    if (!user.mfaSettings?.isEnabled) {
      throw new ValidationError('MFA is not enabled for this account');
    }

    // Verify password
    if (user.password) {
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid password');
      }
    }

    // Verify MFA token
    const isTokenValid = MFAUtil.verifyToken(user.mfaSettings.secret!, token);
    if (!isTokenValid) {
      throw new AuthenticationError('Invalid MFA token');
    }

    // Disable MFA
    user.mfaSettings = {
      isEnabled: false,
      secret: undefined,
      backupCodes: [],
      lastUsedAt: undefined,
    };
    await user.save();

    logger.info(`MFA disabled for user: ${user.email}`, { userId: user.id });

    sendSuccess(res, {}, 'MFA has been disabled for your account');
  });

  // Verify MFA during login
  static verifyMFALogin = asyncHandler(async (req: Request, res: Response) => {
    const { userId, token, backupCode } = req.body;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const user = await User.findById(userId).select('+mfaSettings');
    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid user');
    }

    if (!user.mfaSettings?.isEnabled) {
      throw new ValidationError('MFA is not enabled for this user');
    }

    let isValid = false;

    if (token) {
      // Verify TOTP token
      isValid = MFAUtil.verifyToken(user.mfaSettings.secret!, token);
    } else if (backupCode) {
      // Verify backup code
      isValid = MFAUtil.verifyBackupCode(user.mfaSettings.backupCodes, backupCode);
      if (isValid) {
        // Remove used backup code
        user.mfaSettings.backupCodes = MFAUtil.removeBackupCode(
          user.mfaSettings.backupCodes,
          backupCode
        );
        await user.save();
      }
    }

    if (!isValid) {
      throw new AuthenticationError('Invalid MFA token or backup code');
    }

    // Update last used timestamp
    user.mfaSettings.lastUsedAt = new Date();
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const tokens = JWTUtil.generateTokenPair(user.id, user.email);
    user.addRefreshToken(tokens.refreshToken);
    await user.save();

    logger.info(`MFA login successful for user: ${user.email}`, { userId: user.id });

    sendSuccess(
      res,
      {
        user: {
          id: user.id,
          email: user.email,
          profile: user.profile,
          isEmailVerified: user.isEmailVerified,
          lastLoginAt: user.lastLoginAt,
        },
        tokens,
      },
      'MFA verification successful'
    );
  });

  // Send password reset email
  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError('Email is required');
    }

    const user = await User.findByEmail(email);
    if (!user || !user.isActive) {
      // Don't reveal if user exists
      sendSuccess(
        res,
        {},
        'If an account with this email exists, a password reset link has been sent.'
      );
      return;
    }

    // Generate reset token
    const { token, hashedToken, expires } = SecurityUtil.generatePasswordResetToken();

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expires;
    await user.save();

    // In a real app, send email here
    logger.info(`Password reset requested for user: ${email}`, { userId: user.id });

    sendSuccess(
      res,
      {
        // Only return token in development
        ...(process.env.NODE_ENV === 'development' && { resetToken: token }),
      },
      'If an account with this email exists, a password reset link has been sent.'
    );
  });

  // Reset password with token
  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new ValidationError('Reset token and new password are required');
    }

    // Validate password strength
    const passwordCheck = SecurityUtil.validatePasswordStrength(newPassword);
    if (!passwordCheck.isValid) {
      throw new ValidationError(passwordCheck.feedback.join('. '));
    }

    // Hash the token to compare with stored value
    const hashedToken = SecurityUtil.hashToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AuthenticationError('Password reset token is invalid or has expired');
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Clear all refresh tokens for security
    user.clearRefreshTokens();

    await user.save();

    logger.info(`Password reset successful for user: ${user.email}`, { userId: user.id });

    sendSuccess(res, {}, 'Password has been reset successfully');
  });

  // Get security settings
  static getSecuritySettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user;

    sendSuccess(
      res,
      {
        mfaEnabled: user.mfaSettings?.isEnabled || false,
        socialLogins:
          user.socialLogins?.map((login: any) => ({
            provider: login.provider,
            email: login.email,
            name: login.name,
          })) || [],
        lastLoginAt: user.lastLoginAt,
        allowedIPs: user.securitySettings?.allowedIPs || [],
        trustedDevices: user.securitySettings?.trustedDevices?.length || 0,
      },
      'Security settings retrieved successfully'
    );
  });

  // Update security settings
  static updateSecuritySettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { allowedIPs } = req.body;
    const user = req.user;

    if (allowedIPs) {
      // Validate IP addresses
      const ipRegex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const invalidIPs = allowedIPs.filter((ip: string) => !ipRegex.test(ip));

      if (invalidIPs.length > 0) {
        throw new ValidationError(`Invalid IP addresses: ${invalidIPs.join(', ')}`);
      }

      user.securitySettings = {
        ...user.securitySettings,
        allowedIPs,
      };
      await user.save();
    }

    logger.info(`Security settings updated for user: ${user.email}`, { userId: user.id });

    sendSuccess(res, {}, 'Security settings updated successfully');
  });

  // Link social account
  static linkSocialAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    // This would be called after successful OAuth callback
    const { provider, providerId, email, name, profileUrl } = req.body;
    const user = req.user;

    // Check if this social account is already linked to another user
    const existingUser = await User.findBySocialLogin(provider, providerId);
    if (existingUser && existingUser.id !== user.id) {
      throw new ConflictError('This social account is already linked to another user');
    }

    // Check if user already has this provider linked
    const existingLogin = user.socialLogins?.find((login: any) => login.provider === provider);
    if (existingLogin) {
      throw new ConflictError(`${provider} account is already linked`);
    }

    // Add social login
    user.socialLogins = user.socialLogins || [];
    user.socialLogins.push({
      provider,
      providerId,
      email,
      name,
      profileUrl,
    });
    await user.save();

    logger.info(`Social account linked: ${provider} for user ${user.email}`, { userId: user.id });

    sendSuccess(
      res,
      {
        socialLogins: user.socialLogins.map((login: any) => ({
          provider: login.provider,
          email: login.email,
          name: login.name,
        })),
      },
      `${provider} account linked successfully`
    );
  });

  // Unlink social account
  static unlinkSocialAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { provider } = req.body;
    const user = req.user;

    if (!provider) {
      throw new ValidationError('Provider is required');
    }

    // Don't allow unlinking if it's the only authentication method
    if (!user.password && user.socialLogins?.length === 1) {
      throw new ForbiddenError(
        'Cannot unlink the only authentication method. Set a password first.'
      );
    }

    // Remove social login
    user.socialLogins =
      user.socialLogins?.filter((login: any) => login.provider !== provider) || [];
    await user.save();

    logger.info(`Social account unlinked: ${provider} for user ${user.email}`, { userId: user.id });

    sendSuccess(
      res,
      {
        socialLogins: user.socialLogins.map((login: any) => ({
          provider: login.provider,
          email: login.email,
          name: login.name,
        })),
      },
      `${provider} account unlinked successfully`
    );
  });

  // Send email verification
  static sendEmailVerification = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user;

    if (user.isEmailVerified) {
      throw new ConflictError('Email is already verified');
    }

    // Generate verification token
    const { token, hashedToken } = SecurityUtil.generateEmailVerificationToken();

    user.emailVerificationToken = hashedToken;
    // Add expires field to user schema if needed - for now we'll use 24 hours
    await user.save();

    // In a real app, send email here with the verification link
    // For development, we can return the token
    logger.info(`Email verification requested for user: ${user.email}`, { userId: user.id });

    sendSuccess(
      res,
      {
        message: 'Verification email sent',
        // Only return token in development
        ...(process.env.NODE_ENV === 'development' && { verificationToken: token }),
      },
      'Verification email has been sent to your email address'
    );
  });

  // Verify email with token
  static verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      throw new ValidationError('Verification token is required');
    }

    // Hash the token to compare with stored value
    const hashedToken = SecurityUtil.hashToken(token);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      isEmailVerified: false,
    });

    if (!user) {
      throw new AuthenticationError('Invalid or expired verification token');
    }

    // Verify email
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    logger.info(`Email verified for user: ${user.email}`, { userId: user.id });

    sendSuccess(res, {}, 'Email verified successfully');
  });

  // Resend email verification
  static resendEmailVerification = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError('Email is required');
    }

    const user = await User.findByEmail(email);
    if (!user || !user.isActive) {
      // Don't reveal if user exists
      sendSuccess(
        res,
        {},
        'If an unverified account with this email exists, a verification email has been sent.'
      );
      return;
    }

    if (user.isEmailVerified) {
      sendSuccess(res, {}, 'Email is already verified.');
      return;
    }

    // Generate new verification token
    const { token, hashedToken } = SecurityUtil.generateEmailVerificationToken();

    user.emailVerificationToken = hashedToken;
    await user.save();

    // In a real app, send email here
    logger.info(`Email verification resent for user: ${email}`, { userId: user.id });

    sendSuccess(
      res,
      {
        // Only return token in development
        ...(process.env.NODE_ENV === 'development' && { verificationToken: token }),
      },
      'If an unverified account with this email exists, a verification email has been sent.'
    );
  });
}
