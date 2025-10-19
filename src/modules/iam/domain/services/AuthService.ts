/**
 * AuthService - Authentication Business Logic (Refactored)
 *
 * This service manages all authentication-related operations.
 * Refactored to follow SOLID principles and best practices.
 *
 * Key Improvements:
 * - Dependency Injection: Services injected via constructor
 * - Single Responsibility: Delegates to specialized services (Token, Password)
 * - Interface Segregation: Depends on abstractions, not concrete classes
 * - DRY: Eliminated code duplication
 * - KISS: Simplified complex flows
 *
 * Architecture:
 * - Controller → AuthService → TokenService/PasswordService → User Model
 * - Events published for inter-module communication
 *
 * @class AuthService
 * @implements {IAuthService}
 */

import {User} from "../../../users/domain/models/User";
import {Profile} from "../../../users/domain/models/Profile";
import {TokenService} from "./TokenService";
import {PasswordService} from "./PasswordService";
import {IamEventPublisher} from "../../events/publishers/IamEventPublisher";
import {
  IAuthService,
  ITokenService,
  IPasswordService,
  IEventPublisher,
  IUserRegistrationData,
  IAuthResult,
  IMfaRequired,
} from "../interfaces";
import {
  AuthenticationError,
  ConflictError,
  ValidationError,
} from "../../../../shared/middleware/errorHandler";
import logger from "../../../../shared/infrastructure/logging";

export class AuthService implements IAuthService {
  // DIP: Depend on abstractions (interfaces) not concrete implementations
  private readonly tokenService: ITokenService;
  private readonly passwordService: IPasswordService;
  private readonly eventPublisher: IEventPublisher;

  /**
   * Constructor with Dependency Injection
   *
   * Services are injected to allow:
   * - Easy testing with mocks
   * - Flexible service swapping
   * - Loose coupling
   *
   * @param tokenService - Token management service
   * @param passwordService - Password management service
   * @param eventPublisher - Event publisher for domain events
   */
  constructor(
    tokenService?: ITokenService,
    passwordService?: IPasswordService,
    eventPublisher?: IEventPublisher
  ) {
    // DI with default implementations (can be overridden for testing)
    this.tokenService = tokenService || new TokenService();
    this.passwordService = passwordService || new PasswordService();
    this.eventPublisher = eventPublisher || new IamEventPublisher();
  }

  /**
   * Register a new user account
   *
   * Refactored to:
   * - Use PasswordService for validation and hashing
   * - Use TokenService for token generation
   * - Simplified user creation flow
   * - Better error handling
   *
   * @param {IUserRegistrationData} data - Registration data
   * @returns {Promise<IAuthResult>} User data with tokens
   * @throws {ConflictError} If email or username already exists
   * @throws {ValidationError} If password doesn't meet requirements
   */
  async register(data: IUserRegistrationData): Promise<IAuthResult> {
    const {email, password, firstName, lastName, username} = data;

    // Validate password strength
    const passwordValidation =
      this.passwordService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new ValidationError(passwordValidation.errors.join(", "));
    }

    // Check for existing user
    await this.validateUserDoesNotExist(email, username);

    // Hash password using PasswordService
    const hashedPassword = await this.passwordService.hashPassword(password);

    // Create profile and user
    const {user, profile} = await this.createUserAndProfile({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      username: username.toLowerCase(),
    });

    // Generate tokens using TokenService
    const tokens = this.tokenService.generateTokenPair(user.id, user.email);

    // Store refresh token
    user.addRefreshToken(tokens.refreshToken);
    await user.save();

    // Publish domain event
    this.publishUserRegisteredEvent(user, profile);

    logger.info("User registered successfully", {
      userId: user.id,
      email: user.email,
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

  /**
   * Authenticate user and generate tokens
   *
   * Refactored to:
   * - Use PasswordService for comparison
   * - Use TokenService for generation
   * - Simplified MFA check
   * - Better error messages
   *
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<IAuthResult | IMfaRequired>} Auth result or MFA challenge
   * @throws {AuthenticationError} If credentials invalid or account locked
   */
  async login(
    email: string,
    password: string
  ): Promise<IAuthResult | IMfaRequired> {
    // Find and validate user
    const user = await this.findUserForLogin(email);
    await this.validateUserCanLogin(user);

    // Verify password using PasswordService
    const isPasswordValid = await this.verifyUserPassword(user, password);
    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      throw new AuthenticationError("Invalid credentials");
    }

    // Reset failed attempts on successful login
    await this.resetFailedLoginAttempts(user);

    // Check if MFA is required
    if (this.isMfaRequired(user)) {
      return this.createMfaChallenge(user);
    }

    // Generate tokens using TokenService
    const tokens = this.tokenService.generateTokenPair(user.id, user.email);

    // Update user session info
    await this.updateUserSession(user, tokens.refreshToken);

    // Publish event
    this.publishUserLoggedInEvent(user);

    logger.info("User logged in successfully", {
      userId: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        profile: user.profile,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
      },
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   *
   * Refactored to use TokenService for verification and generation.
   *
   * @param {string} refreshToken - Valid refresh token
   * @returns {Promise<{tokens: any}>} New token pair
   * @throws {AuthenticationError} If token invalid or user not found
   */
  async refreshToken(refreshToken: string): Promise<{tokens: any}> {
    if (!refreshToken) {
      throw new AuthenticationError("Refresh token is required");
    }

    // Verify token using TokenService
    const decoded = this.tokenService.verifyRefreshToken(refreshToken);

    // Validate user and token
    const user = await this.validateRefreshToken(decoded.userId, refreshToken);

    // Generate new token pair
    const tokens = this.tokenService.generateTokenPair(user.id, user.email);

    // Rotate refresh token (security best practice)
    user.removeRefreshToken(refreshToken);
    user.addRefreshToken(tokens.refreshToken);
    await user.save();

    logger.info("Token refreshed", {userId: user.id});

    return {tokens};
  }

  /**
   * Logout user and invalidate tokens
   *
   * @param {string} userId - User ID
   * @param {string} refreshToken - Optional specific token to invalidate
   * @returns {Promise<{success: boolean}>} Success indicator
   */
  async logout(
    userId: string,
    refreshToken?: string
  ): Promise<{success: boolean}> {
    const user = await User.findById(userId).select("+refreshTokens");
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Invalidate tokens
    if (refreshToken) {
      user.removeRefreshToken(refreshToken);
    } else {
      user.clearRefreshTokens();
    }

    await user.save();

    // Publish event
    this.publishUserLoggedOutEvent(user);

    logger.info("User logged out", {userId: user.id});

    return {success: true};
  }

  /**
   * Change user password
   *
   * Refactored to use PasswordService for validation and hashing.
   *
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<{success: boolean}>} Success indicator
   * @throws {AuthenticationError} If current password incorrect
   * @throws {ValidationError} If new password doesn't meet requirements
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{success: boolean}> {
    // Validate new password strength
    const validation =
      this.passwordService.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors.join(", "));
    }

    // Get user with password
    const user = await User.findById(userId).select("+password +refreshTokens");
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await this.passwordService.comparePassword(
      currentPassword,
      user.password!
    );
    if (!isCurrentPasswordValid) {
      throw new AuthenticationError("Current password is incorrect");
    }

    // Hash new password
    user.password = await this.passwordService.hashPassword(newPassword);

    // Clear all refresh tokens for security
    user.clearRefreshTokens();
    await user.save();

    // Publish event
    this.publishPasswordChangedEvent(user);

    logger.info("Password changed", {userId: user.id});

    return {success: true};
  }

  /**
   * Deactivate user account
   *
   * @param {string} userId - User ID
   * @param {string} password - Password confirmation
   * @returns {Promise<{success: boolean}>} Success indicator
   */
  async deactivateAccount(
    userId: string,
    password: string
  ): Promise<{success: boolean}> {
    const user = await User.findById(userId).select("+password +refreshTokens");
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Verify password
    const isPasswordValid = await this.passwordService.comparePassword(
      password,
      user.password!
    );
    if (!isPasswordValid) {
      throw new AuthenticationError("Password is incorrect");
    }

    // Deactivate account
    user.isActive = false;
    user.clearRefreshTokens();
    await user.save();

    // Publish event
    this.publishAccountDeactivatedEvent(user);

    logger.info("Account deactivated", {userId: user.id});

    return {success: true};
  }

  /**
   * Get user profile
   *
   * @param {string} userId - User ID
   * @returns {Promise<any>} User profile data
   */
  async getProfile(userId: string): Promise<any> {
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

  // ==================== Private Helper Methods ====================
  // Following KISS principle - break complex logic into smaller methods

  /**
   * Validate that email and username are not already taken
   * @private
   */
  private async validateUserDoesNotExist(
    email: string,
    username: string
  ): Promise<void> {
    const [existingUser, existingProfile] = await Promise.all([
      User.findByEmail(email),
      Profile.findByUsername(username),
    ]);

    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    if (existingProfile) {
      throw new ConflictError("Username is already taken");
    }
  }

  /**
   * Create user and profile documents
   * @private
   */
  private async createUserAndProfile(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
  }): Promise<{user: any; profile: any}> {
    // Create profile
    const profile = new Profile({
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      user: null,
    });

    // Create user
    const user = new User({
      email: data.email,
      password: data.password,
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

    // Link profile to user
    profile.user = user._id as any;

    // Save both
    await Promise.all([user.save(), profile.save()]);

    return {user, profile};
  }

  /**
   * Find user for login with required fields
   * @private
   */
  private async findUserForLogin(email: string): Promise<any> {
    const user = await User.findByEmail(email);
    if (!user) {
      throw new AuthenticationError("Invalid credentials");
    }

    // Get user with password and sensitive fields
    const userWithPassword = await User.findById(user._id)
      .select("+password +refreshTokens +mfaSettings")
      .populate("profile");

    if (!userWithPassword) {
      throw new AuthenticationError("Invalid credentials");
    }

    return userWithPassword;
  }

  /**
   * Validate user can login
   * @private
   */
  private async validateUserCanLogin(user: any): Promise<void> {
    if (!user.isActive) {
      throw new AuthenticationError("Account is deactivated");
    }

    if (user.isAccountLocked()) {
      throw new AuthenticationError(
        "Account is temporarily locked due to too many failed attempts"
      );
    }
  }

  /**
   * Verify user password
   * @private
   */
  private async verifyUserPassword(
    user: any,
    password: string
  ): Promise<boolean> {
    if (!user.password) {
      throw new AuthenticationError("Please use social login for this account");
    }

    return this.passwordService.comparePassword(password, user.password);
  }

  /**
   * Reset failed login attempts
   * @private
   */
  private async resetFailedLoginAttempts(user: any): Promise<void> {
    if (user.securitySettings?.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }
  }

  /**
   * Check if MFA is required
   * @private
   */
  private isMfaRequired(user: any): boolean {
    return user.mfaSettings?.isEnabled === true;
  }

  /**
   * Create MFA challenge response
   * @private
   */
  private createMfaChallenge(user: any): IMfaRequired {
    return {
      requiresMFA: true,
      userId: user.id,
      email: user.email,
    };
  }

  /**
   * Update user session info
   * @private
   */
  private async updateUserSession(
    user: any,
    refreshToken: string
  ): Promise<void> {
    user.addRefreshToken(refreshToken);
    user.lastLoginAt = new Date();
    await user.save();
  }

  /**
   * Validate refresh token and return user
   * @private
   */
  private async validateRefreshToken(
    userId: string,
    refreshToken: string
  ): Promise<any> {
    const user = await User.findById(userId)
      .select("+refreshTokens")
      .populate("profile");

    if (!user || !user.isActive) {
      throw new AuthenticationError("Invalid refresh token");
    }

    if (!user.refreshTokens?.includes(refreshToken)) {
      // Clear all tokens if invalid token is used (security measure)
      user.clearRefreshTokens();
      await user.save();
      throw new AuthenticationError("Invalid refresh token");
    }

    return user;
  }

  /**
   * Publish user registered event
   * @private
   */
  private publishUserRegisteredEvent(user: any, profile: any): void {
    this.eventPublisher.publishUserRegistered({
      userId: user.id,
      email: user.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username,
      profileId: profile.id,
    });
  }

  /**
   * Publish user logged in event
   * @private
   */
  private publishUserLoggedInEvent(user: any): void {
    this.eventPublisher.publishUserLoggedIn({
      userId: user.id,
      email: user.email,
      timestamp: new Date(),
    });
  }

  /**
   * Publish user logged out event
   * @private
   */
  private publishUserLoggedOutEvent(user: any): void {
    this.eventPublisher.publishUserLoggedOut({
      userId: user.id,
      email: user.email,
      timestamp: new Date(),
    });
  }

  /**
   * Publish password changed event
   * @private
   */
  private publishPasswordChangedEvent(user: any): void {
    this.eventPublisher.publishPasswordChanged({
      userId: user.id,
      email: user.email,
      timestamp: new Date(),
    });
  }

  /**
   * Publish account deactivated event
   * @private
   */
  private publishAccountDeactivatedEvent(user: any): void {
    this.eventPublisher.publishAccountDeactivated({
      userId: user.id,
      email: user.email,
      timestamp: new Date(),
    });
  }
}
