import {Request, Response, NextFunction} from "express";
import {AuthService} from "../../domain/services/AuthService";
import {
  sendSuccess,
  sendCreated,
  asyncHandler,
} from "../../../../shared/middleware/errorHandler";
import {AuthRequest} from "../../../../shared/middleware/auth";
import {AuditLogger} from "../../../../shared/services/audit";
import logger from "../../../../shared/infrastructure/logging";
import {IAuthService, IUserRegistrationData} from "../../domain/interfaces";

/**
 * AuthController - Handles all authentication-related HTTP requests (Refactored)
 *
 * This controller manages user authentication, registration, token management,
 * and account operations. Refactored to follow best practices and SOLID principles.
 *
 * Key Improvements:
 * - Dependency Injection: AuthService injected via constructor
 * - Interface-based: Depends on IAuthService abstraction
 * - Cleaner code: Simplified request handling
 * - Better typing: Uses proper TypeScript interfaces
 *
 * Architecture:
 * - Controller → Service Interface → Service Implementation
 * - Thin controller focused on HTTP concerns
 * - Business logic delegated to AuthService
 *
 * @class AuthController
 */
export class AuthController {
  // DIP: Depend on abstraction (interface) not concrete implementation
  private readonly authService: IAuthService;

  /**
   * Constructor with Dependency Injection
   *
   * Allows injection of custom AuthService implementation for testing.
   * Defaults to standard AuthService for production use.
   *
   * @param authService - Authentication service implementation
   */
  constructor(authService?: IAuthService) {
    this.authService = authService || new AuthService();
  }

  /**
   * Register a new user account
   *
   * Creates a new user with email/password credentials and profile information.
   * Automatically generates JWT access and refresh tokens upon successful registration.
   * Logs the registration event for audit purposes.
   *
   * @async
   * @param {Request} req - Express request object containing user registration data
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 201 Created with user data and tokens
   *
   * @throws {ValidationError} If email format is invalid or password doesn't meet requirements
   * @throws {ConflictError} If email already exists in the system
   *
   * @example
   * POST /api/v1/auth/register
   * Body: {
   *   email: "user@example.com",
   *   password: "SecurePass123!",
   *   firstName: "John",
   *   lastName: "Doe",
   *   username: "johndoe"
   * }
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    // Extract and structure registration data
    const registrationData: IUserRegistrationData = {
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      username: req.body.username,
    };

    // Delegate to service
    const result = await this.authService.register(registrationData);

    logger.info(`New user registered: ${registrationData.email}`, {
      userId: result.user.id,
    });

    // Log audit event for security monitoring
    await AuditLogger.logAuth({
      req,
      action: "registration",
      userId: result.user.id,
      status: "success",
      details: {email: registrationData.email, hasProfile: true},
    });

    sendCreated(res, result, "User registered successfully");
  });

  /**
   * Authenticate user and generate tokens
   *
   * Validates user credentials and generates JWT access and refresh tokens.
   * Supports Multi-Factor Authentication (MFA) if enabled for the user.
   * Logs successful login attempts for security audit trail.
   *
   * @async
   * @param {Request} req - Express request object with email and password
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with user data and tokens, or MFA challenge
   *
   * @throws {UnauthorizedError} If credentials are invalid or account is deactivated
   *
   * @example
   * POST /api/v1/auth/login
   * Body: { email: "user@example.com", password: "SecurePass123!" }
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const {email, password} = req.body;

    const result = await this.authService.login(email, password);

    // Handle MFA verification if required
    if ("requiresMFA" in result && result.requiresMFA) {
      sendSuccess(res, result, "MFA verification required");
      return;
    }

    logger.info(`User logged in: ${email}`, {
      userId: (result as any).user.id,
    });

    // Log successful authentication for audit trail
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

  /**
   * Refresh expired access token
   *
   * Generates a new access token using a valid refresh token.
   * This endpoint allows users to maintain their session without re-entering credentials.
   * The refresh token must be valid and not expired (30-day lifetime).
   *
   * @async
   * @param {Request} req - Express request object containing refresh token
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with new access token
   *
   * @throws {UnauthorizedError} If refresh token is invalid, expired, or revoked
   *
   * @example
   * POST /api/v1/auth/refresh-token
   * Body: { refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const {refreshToken} = req.body;

    const result = await this.authService.refreshToken(refreshToken);

    sendSuccess(res, result, "Token refreshed successfully");
  });

  /**
   * Logout user and invalidate refresh token
   *
   * Invalidates the user's refresh token to prevent further token refreshes.
   * The access token will remain valid until expiration but cannot be refreshed.
   * Logs logout event for security monitoring.
   *
   * @async
   * @param {AuthRequest} req - Authenticated request with user context
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with success message
   *
   * @requires Authentication - User must be authenticated via JWT access token
   *
   * @example
   * POST /api/v1/auth/logout
   * Headers: { Authorization: "Bearer <access-token>" }
   * Body: { refreshToken: "..." }
   */
  logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {refreshToken} = req.body;

    await this.authService.logout(req.userId!, refreshToken);

    logger.info(`User logged out: ${req.user.email}`, {
      userId: req.userId,
    });

    // Log logout for audit trail
    await AuditLogger.logAuth({
      req,
      action: "logout",
      userId: req.userId!,
      status: "success",
      details: {tokenCleared: !!refreshToken},
    });

    sendSuccess(res, null, "Logout successful");
  });

  /**
   * Get authenticated user's profile
   *
   * Retrieves the complete profile information for the currently authenticated user,
   * including personal details, stats, and account status.
   *
   * @async
   * @param {AuthRequest} req - Authenticated request with user ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with user profile data
   *
   * @requires Authentication - User must be authenticated via JWT access token
   *
   * @example
   * GET /api/v1/auth/profile
   * Headers: { Authorization: "Bearer <access-token>" }
   */
  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await this.authService.getProfile(req.userId!);

    sendSuccess(res, result);
  });

  /**
   * Change user password
   *
   * Updates the user's password after verifying the current password.
   * Requires re-authentication after password change for security.
   * All existing refresh tokens are invalidated upon successful password change.
   *
   * @async
   * @param {AuthRequest} req - Authenticated request with password data
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with success message
   *
   * @requires Authentication - User must be authenticated via JWT access token
   *
   * @throws {UnauthorizedError} If current password is incorrect
   * @throws {ValidationError} If new password doesn't meet security requirements
   *
   * @example
   * PUT /api/v1/auth/change-password
   * Headers: { Authorization: "Bearer <access-token>" }
   * Body: {
   *   currentPassword: "OldPass123!",
   *   newPassword: "NewSecurePass123!"
   * }
   */
  changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {currentPassword, newPassword} = req.body;

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

  /**
   * Deactivate user account
   *
   * Marks the user account as inactive. The account is not permanently deleted
   * but cannot be used to login. User data is retained for potential reactivation.
   * Requires password confirmation for security.
   *
   * @async
   * @param {AuthRequest} req - Authenticated request with password confirmation
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with success message
   *
   * @requires Authentication - User must be authenticated via JWT access token
   *
   * @throws {UnauthorizedError} If password confirmation is incorrect
   *
   * @example
   * DELETE /api/v1/auth/deactivate
   * Headers: { Authorization: "Bearer <access-token>" }
   * Body: { password: "SecurePass123!" }
   */
  deactivateAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {password} = req.body;

    await this.authService.deactivateAccount(req.userId!, password);

    logger.info(`Account deactivated for user: ${req.user.email}`, {
      userId: req.userId,
    });

    sendSuccess(res, null, "Account deactivated successfully");
  });
}

/**
 * Singleton instance of AuthController
 * Exported for use in route definitions
 * @const {AuthController}
 */
export const authController = new AuthController();
