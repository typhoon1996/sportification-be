import { Request, Response } from 'express';
import { User } from '../models/User';
import { Profile } from '../models/Profile';
import { JWTUtil } from '../utils/jwt';
import { AuditLogger } from '../utils/audit';
import {
  ValidationError,
  AuthenticationError,
  ConflictError,
  sendSuccess,
  sendCreated,
  asyncHandler,
} from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class AuthController {
  // Register new user
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, username } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Check if username is taken
    const existingProfile = await Profile.findByUsername(username);
    if (existingProfile) {
      throw new ConflictError('Username is already taken');
    }

    // Create profile first
    const profile = new Profile({
      firstName,
      lastName,
      username: username.toLowerCase(),
      user: null, // Will be set after user creation
    });

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password,
      profile: profile._id,
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en',
      },
      stats: {
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
      },
    });

    // Set user reference in profile
    profile.user = user._id as any;

    // Save both documents
    await Promise.all([user.save(), profile.save()]);

    // Generate tokens
    const tokens = JWTUtil.generateTokenPair(user.id, user.email);

    // Add refresh token to user
    user.addRefreshToken(tokens.refreshToken);
    await user.save();

    logger.info(`New user registered: ${email}`, { userId: user.id });

    // Log audit event
    await AuditLogger.logAuth({
      req,
      action: 'registration',
      userId: user.id,
      status: 'success',
      details: { email, hasProfile: true },
    });

    sendCreated(
      res,
      {
        user: {
          id: user.id,
          email: user.email,
          profile: profile,
          isEmailVerified: user.isEmailVerified,
        },
        tokens,
      },
      'User registered successfully'
    );
  });

  // Login user
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find user with password field and security settings
    const user = await User.findByEmail(email);
    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      logger.warn(`Login attempt on locked account: ${email}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      throw new AuthenticationError(
        'Account is temporarily locked due to too many failed attempts'
      );
    }

    // Get user with password for comparison
    const userWithPassword = await User.findById(user._id)
      .select('+password +refreshTokens +mfaSettings')
      .populate('profile');
    if (!userWithPassword) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check password (only if user has a password set)
    if (userWithPassword.password) {
      const isPasswordValid = await userWithPassword.comparePassword(password);
      if (!isPasswordValid) {
        logger.warn(`Failed login attempt for email: ${email}`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        // Increment failed login attempts
        await user.incrementLoginAttempts();

        // Log audit event
        await AuditLogger.logAuth({
          req,
          action: 'login_failed',
          userId: user.id,
          status: 'failure',
          details: { email, reason: 'invalid_password' },
        });

        throw new AuthenticationError('Invalid credentials');
      }
    } else {
      // User only has social logins
      throw new AuthenticationError('Please use social login for this account');
    }

    // Reset login attempts on successful password verification
    if (user.securitySettings?.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Check if MFA is enabled
    if (userWithPassword.mfaSettings?.isEnabled) {
      // Return user ID for MFA verification step
      sendSuccess(
        res,
        {
          requiresMFA: true,
          userId: userWithPassword.id,
          email: userWithPassword.email,
        },
        'MFA verification required'
      );
      return;
    }

    // Generate tokens
    const tokens = JWTUtil.generateTokenPair(userWithPassword.id, userWithPassword.email);

    // Add refresh token and update last login
    userWithPassword.addRefreshToken(tokens.refreshToken);
    userWithPassword.lastLoginAt = new Date();
    await userWithPassword.save();

    logger.info(`User logged in: ${email}`, { userId: userWithPassword.id });

    // Log audit event
    await AuditLogger.logAuth({
      req,
      action: 'login',
      userId: userWithPassword.id,
      status: 'success',
      details: {
        email,
        mfaRequired: userWithPassword.mfaSettings?.isEnabled,
        loginMethod: 'password',
      },
    });

    sendSuccess(
      res,
      {
        user: {
          id: userWithPassword.id,
          email: userWithPassword.email,
          profile: userWithPassword.profile,
          isEmailVerified: user.isEmailVerified,
          lastLoginAt: user.lastLoginAt,
        },
        tokens,
      },
      'Login successful'
    );
  });

  // Refresh access token
  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    // Verify refresh token
    const decoded = JWTUtil.verifyRefreshToken(refreshToken);

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.userId).select('+refreshTokens').populate('profile');

    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid refresh token');
    }

    if (!user.refreshTokens?.includes(refreshToken)) {
      logger.warn(`Invalid refresh token used for user: ${user.email}`, {
        userId: user.id,
        ip: req.ip,
      });

      // Clear all refresh tokens for security
      user.clearRefreshTokens();
      await user.save();

      throw new AuthenticationError('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = JWTUtil.generateTokenPair(user.id, user.email);

    // Replace old refresh token with new one
    user.removeRefreshToken(refreshToken);
    user.addRefreshToken(tokens.refreshToken);
    await user.save();

    sendSuccess(
      res,
      {
        tokens,
      },
      'Token refreshed successfully'
    );
  });

  // Logout user
  static logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove specific refresh token
      req.user.removeRefreshToken(refreshToken);
    } else {
      // Clear all refresh tokens
      req.user.clearRefreshTokens();
    }

    await req.user.save();

    logger.info(`User logged out: ${req.user.email}`, { userId: req.user.id });

    // Log audit event
    await AuditLogger.logAuth({
      req,
      action: 'logout',
      userId: req.user.id,
      status: 'success',
      details: { tokenCleared: !!refreshToken },
    });

    sendSuccess(res, null, 'Logout successful');
  });

  // Get current user profile
  static getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.userId)
      .populate('profile')
      .populate('achievements', 'name description icon points');

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    sendSuccess(res, {
      id: user.id,
      email: user.email,
      profile: user.profile,
      achievements: user.achievements,
      stats: user.stats,
      preferences: user.preferences,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt,
    });
  });

  // Update user profile
  static updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const updates = req.body;

    // Separate user updates from profile updates
    const userUpdates: any = {};
    const profileUpdates: any = {};

    // Fields that belong to user model
    const userFields = ['preferences', 'stats'];
    // Fields that belong to profile model
    const profileFields = ['firstName', 'lastName', 'bio', 'avatar', 'location', 'phoneNumber'];

    Object.keys(updates).forEach((key) => {
      if (userFields.includes(key)) {
        userUpdates[key] = updates[key];
      } else if (profileFields.includes(key)) {
        profileUpdates[key] = updates[key];
      }
    });

    const updatePromises = [];

    // Update user if there are user updates
    if (Object.keys(userUpdates).length > 0) {
      updatePromises.push(
        User.findByIdAndUpdate(req.userId, userUpdates, {
          new: true,
          runValidators: true,
        })
      );
    }

    // Update profile if there are profile updates
    if (Object.keys(profileUpdates).length > 0) {
      updatePromises.push(
        Profile.findOneAndUpdate({ user: req.userId }, profileUpdates, {
          new: true,
          runValidators: true,
        })
      );
    }

    if (updatePromises.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    await Promise.all(updatePromises);

    // Get updated user with profile
    const updatedUser = await User.findById(req.userId)
      .populate('profile')
      .populate('achievements');

    logger.info(`Profile updated for user: ${req.user.email}`, {
      userId: req.userId,
      updates: Object.keys(updates),
    });

    sendSuccess(
      res,
      {
        id: updatedUser!.id,
        email: updatedUser!.email,
        profile: updatedUser!.profile,
        achievements: updatedUser!.achievements,
        stats: updatedUser!.stats,
        preferences: updatedUser!.preferences,
      },
      'Profile updated successfully'
    );
  });

  // Change password
  static changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.userId).select('+password +refreshTokens');
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new ValidationError('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;

    // Clear all refresh tokens for security
    user.clearRefreshTokens();

    await user.save();

    logger.info(`Password changed for user: ${user.email}`, { userId: user.id });

    sendSuccess(res, null, 'Password changed successfully. Please log in again.');
  });

  // Deactivate account
  static deactivateAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { password } = req.body;

    // Get user with password
    const user = await User.findById(req.userId).select('+password +refreshTokens');
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ValidationError('Password is incorrect');
    }

    // Deactivate account
    user.isActive = false;
    user.clearRefreshTokens();
    await user.save();

    logger.info(`Account deactivated for user: ${user.email}`, { userId: user.id });

    sendSuccess(res, null, 'Account deactivated successfully');
  });
}
