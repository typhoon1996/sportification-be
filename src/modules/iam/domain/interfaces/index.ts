/**
 * Service Interfaces for IAM Module
 * 
 * These interfaces define contracts for various authentication-related services.
 * Following Dependency Inversion Principle - depend on abstractions, not concrete implementations.
 * 
 * Benefits:
 * - Easier testing through mocking
 * - Loosely coupled code
 * - Flexibility to swap implementations
 * - Clear API contracts
 */

/**
 * Token payload interface
 */
export interface ITokenPayload {
  userId: string;
  email: string;
}

/**
 * Token pair interface
 */
export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Token Service Interface
 * Handles all JWT token operations
 */
export interface ITokenService {
  /**
   * Generate access and refresh token pair
   * @param userId - User ID
   * @param email - User email
   * @returns Token pair with expiration
   */
  generateTokenPair(userId: string, email: string): ITokenPair;

  /**
   * Verify access token and return payload
   * @param token - JWT access token
   * @returns Token payload
   * @throws AuthenticationError if invalid
   */
  verifyAccessToken(token: string): ITokenPayload;

  /**
   * Verify refresh token and return payload
   * @param token - JWT refresh token
   * @returns Token payload
   * @throws AuthenticationError if invalid
   */
  verifyRefreshToken(token: string): ITokenPayload;

  /**
   * Decode token without verification (for inspection)
   * @param token - JWT token
   * @returns Decoded payload or null
   */
  decodeToken(token: string): ITokenPayload | null;
}

/**
 * Password Service Interface
 * Handles password hashing and validation
 */
export interface IPasswordService {
  /**
   * Hash a plain text password
   * @param password - Plain text password
   * @returns Hashed password
   */
  hashPassword(password: string): Promise<string>;

  /**
   * Compare plain text password with hash
   * @param password - Plain text password
   * @param hashedPassword - Hashed password
   * @returns True if match, false otherwise
   */
  comparePassword(password: string, hashedPassword: string): Promise<boolean>;

  /**
   * Validate password strength
   * @param password - Password to validate
   * @returns Validation result with errors if any
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  };
}

/**
 * User registration data
 */
export interface IUserRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}

/**
 * Authentication result
 */
export interface IAuthResult {
  user: {
    id: string;
    email: string;
    profile: any;
    isEmailVerified: boolean;
    lastLoginAt?: Date;
  };
  tokens: ITokenPair;
}

/**
 * MFA required result
 */
export interface IMfaRequired {
  requiresMFA: true;
  userId: string;
  email: string;
}

/**
 * Auth Service Interface
 * Main authentication service handling user registration and login
 */
export interface IAuthService {
  /**
   * Register a new user
   * @param data - Registration data
   * @returns Authentication result with user and tokens
   */
  register(data: IUserRegistrationData): Promise<IAuthResult>;

  /**
   * Login user with email and password
   * @param email - User email
   * @param password - User password
   * @returns Authentication result or MFA challenge
   */
  login(email: string, password: string): Promise<IAuthResult | IMfaRequired>;

  /**
   * Refresh access token using refresh token
   * @param refreshToken - Valid refresh token
   * @returns New token pair
   */
  refreshToken(refreshToken: string): Promise<{ tokens: ITokenPair }>;

  /**
   * Logout user and invalidate tokens
   * @param userId - User ID
   * @param refreshToken - Optional specific token to invalidate
   * @returns Success indicator
   */
  logout(userId: string, refreshToken?: string): Promise<{ success: boolean }>;

  /**
   * Change user password
   * @param userId - User ID
   * @param currentPassword - Current password
   * @param newPassword - New password
   * @returns Success indicator
   */
  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean }>;

  /**
   * Deactivate user account
   * @param userId - User ID
   * @param password - Password confirmation
   * @returns Success indicator
   */
  deactivateAccount(
    userId: string,
    password: string
  ): Promise<{ success: boolean }>;

  /**
   * Get user profile
   * @param userId - User ID
   * @returns User profile data
   */
  getProfile(userId: string): Promise<any>;
}

/**
 * Event Publisher Interface
 * Publishes domain events for inter-module communication
 */
export interface IEventPublisher {
  /**
   * Publish user registered event
   * @param payload - Event payload
   */
  publishUserRegistered(payload: any): void;

  /**
   * Publish user logged in event
   * @param payload - Event payload
   */
  publishUserLoggedIn(payload: any): void;

  /**
   * Publish user logged out event
   * @param payload - Event payload
   */
  publishUserLoggedOut(payload: any): void;

  /**
   * Publish password changed event
   * @param payload - Event payload
   */
  publishPasswordChanged(payload: any): void;

  /**
   * Publish account deactivated event
   * @param payload - Event payload
   */
  publishAccountDeactivated(payload: any): void;
}
