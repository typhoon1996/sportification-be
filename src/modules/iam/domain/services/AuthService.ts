import bcrypt from "bcryptjs";
import { User } from "../../../users/domain/models/User";
import { Profile } from "../../../users/domain/models/Profile";
import { JWTUtil } from '../../../../shared/lib/auth';
import { IamEventPublisher } from "../../events/publishers/IamEventPublisher";
import {
  AuthenticationError,
  ConflictError,
} from "../../../../shared/middleware/errorHandler";

/**
 * AuthService - Handles authentication business logic
 * 
 * This service manages all authentication-related operations including user registration,
 * login, token management, and session handling. It implements secure authentication
 * practices with JWT tokens and bcrypt password hashing.
 * 
 * Key Responsibilities:
 * - User registration with validation
 * - Login authentication and token generation
 * - Refresh token management
 * - Password change and reset operations
 * - Account deactivation
 * - Event publication for authentication actions
 * 
 * Security Features:
 * - Password hashing with bcrypt (10 rounds)
 * - JWT access tokens (7-day expiry)
 * - JWT refresh tokens (30-day expiry)
 * - Refresh token rotation on use
 * - Email uniqueness validation
 * - Username uniqueness validation
 * 
 * @class AuthService
 */
export class AuthService {
  private eventPublisher: IamEventPublisher;

  /**
   * Initializes the AuthService with event publisher for domain events
   */
  constructor() {
    this.eventPublisher = new IamEventPublisher();
  }

  /**
   * Register a new user account
   * 
   * Creates a new user with email/password credentials and profile information.
   * Performs validation to ensure email and username uniqueness. Automatically
   * generates and returns JWT access and refresh tokens upon successful registration.
   * 
   * Process Flow:
   * 1. Validate email is not already registered
   * 2. Validate username is not already taken
   * 3. Create profile with user information
   * 4. Create user with hashed password
   * 5. Link user and profile bidirectionally
   * 6. Generate JWT token pair
   * 7. Store refresh token in user document
   * 8. Publish user.registered event
   * 9. Return user data with tokens
   * 
   * @async
   * @param {string} email - User's email address (will be lowercased)
   * @param {string} password - User's password (will be hashed with bcrypt)
   * @param {string} firstName - User's first name
   * @param {string} lastName - User's last name
   * @param {string} username - Desired username (will be lowercased)
   * @returns {Promise<{user: User, profile: Profile, accessToken: string, refreshToken: string}>}
   * 
   * @throws {ConflictError} If email already exists in the system
   * @throws {ConflictError} If username is already taken
   * 
   * @example
   * const result = await authService.register(
   *   'user@example.com',
   *   'SecurePass123!',
   *   'John',
   *   'Doe',
   *   'johndoe'
   * );
   * // Returns: { user, profile, accessToken, refreshToken }
   */
  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    username: string
  ) {
    // Check if user already exists by email
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Check if username is already taken
    const existingProfile = await Profile.findByUsername(username);
    if (existingProfile) {
      throw new ConflictError("Username is already taken");
    }

    // Create profile first with user information
    const profile = new Profile({
      firstName,
      lastName,
      username: username.toLowerCase(),
      user: null, // Will be set after user creation
    });

    // Create user with hashed password (hashing happens in User model pre-save hook)
    const user = new User({
      email: email.toLowerCase(),
      password,
      profile: profile._id,
      preferences: {
        theme: "light",
        notifications: true,
        language: "en",
      },
      stats: {
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
      },
    });

    // Set bidirectional reference between user and profile
    profile.user = user._id as any;

    // Save both documents atomically
    await Promise.all([user.save(), profile.save()]);

    // Generate JWT access and refresh tokens
    const tokens = JWTUtil.generateTokenPair(user.id, user.email);

    // Store refresh token in user document for validation
    user.addRefreshToken(tokens.refreshToken);
    await user.save();

    // Publish domain event for other modules to react
    this.eventPublisher.publishUserRegistered({
      userId: user.id,
      email: user.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username,
      profileId: profile.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        profile: profile,
        isEmailVerified: user.isEmailVerified,
      },
      tokens,
    };
  }

  async login(email: string, password: string) {
    // Find user with password field
    const user = await User.findByEmail(email);
    if (!user || !user.isActive) {
      throw new AuthenticationError("Invalid credentials");
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      throw new AuthenticationError(
        "Account is temporarily locked due to too many failed attempts"
      );
    }

    // Get user with password for comparison
    const userWithPassword = await User.findById(user._id)
      .select("+password +refreshTokens +mfaSettings")
      .populate("profile");
    if (!userWithPassword) {
      throw new AuthenticationError("Invalid credentials");
    }

    // Check password (only if user has a password set)
    if (userWithPassword.password) {
      const isPasswordValid = await userWithPassword.comparePassword(password);
      if (!isPasswordValid) {
        // Increment failed login attempts
        await user.incrementLoginAttempts();
        throw new AuthenticationError("Invalid credentials");
      }
    } else {
      // User only has social logins
      throw new AuthenticationError("Please use social login for this account");
    }

    // Reset login attempts on successful password verification
    if (user.securitySettings?.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Check if MFA is enabled
    if (userWithPassword.mfaSettings?.isEnabled) {
      return {
        requiresMFA: true,
        userId: userWithPassword.id,
        email: userWithPassword.email,
      };
    }

    // Generate tokens
    const tokens = JWTUtil.generateTokenPair(
      userWithPassword.id,
      userWithPassword.email
    );

    // Add refresh token and update last login
    userWithPassword.addRefreshToken(tokens.refreshToken);
    userWithPassword.lastLoginAt = new Date();
    await userWithPassword.save();

    // Publish event
    this.eventPublisher.publishUserLoggedIn({
      userId: userWithPassword.id,
      email: userWithPassword.email,
      timestamp: new Date(),
    });

    return {
      user: {
        id: userWithPassword.id,
        email: userWithPassword.email,
        profile: userWithPassword.profile,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
      },
      tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new AuthenticationError("Refresh token is required");
    }

    // Verify refresh token
    const decoded = JWTUtil.verifyRefreshToken(refreshToken);

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.userId)
      .select("+refreshTokens")
      .populate("profile");

    if (!user || !user.isActive) {
      throw new AuthenticationError("Invalid refresh token");
    }

    if (!user.refreshTokens?.includes(refreshToken)) {
      // Clear all refresh tokens for security
      user.clearRefreshTokens();
      await user.save();
      throw new AuthenticationError("Invalid refresh token");
    }

    // Generate new tokens
    const tokens = JWTUtil.generateTokenPair(user.id, user.email);

    // Replace old refresh token with new one
    user.removeRefreshToken(refreshToken);
    user.addRefreshToken(tokens.refreshToken);
    await user.save();

    return { tokens };
  }

  async logout(userId: string, refreshToken?: string) {
    const user = await User.findById(userId).select("+refreshTokens");
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    if (refreshToken) {
      // Remove specific refresh token
      user.removeRefreshToken(refreshToken);
    } else {
      // Clear all refresh tokens
      user.clearRefreshTokens();
    }

    await user.save();

    // Publish event
    this.eventPublisher.publishUserLoggedOut({
      userId: user.id,
      email: user.email,
      timestamp: new Date(),
    });

    return { success: true };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    // Get user with password
    const user = await User.findById(userId).select("+password +refreshTokens");
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new AuthenticationError("Current password is incorrect");
    }

    // Update password
    user.password = newPassword;

    // Clear all refresh tokens for security
    user.clearRefreshTokens();

    await user.save();

    // Publish event
    this.eventPublisher.publishPasswordChanged({
      userId: user.id,
      email: user.email,
      timestamp: new Date(),
    });

    return { success: true };
  }

  async deactivateAccount(userId: string, password: string) {
    // Get user with password
    const user = await User.findById(userId).select("+password +refreshTokens");
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AuthenticationError("Password is incorrect");
    }

    // Deactivate account
    user.isActive = false;
    user.clearRefreshTokens();
    await user.save();

    // Publish event
    this.eventPublisher.publishAccountDeactivated({
      userId: user.id,
      email: user.email,
      timestamp: new Date(),
    });

    return { success: true };
  }

  async getProfile(userId: string) {
    const user = await User.findById(userId)
      .populate("profile")
      .populate("achievements", "name description icon points");

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      profile: user.profile,
      achievements: user.achievements,
      stats: user.stats,
      preferences: user.preferences,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
