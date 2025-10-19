/**
 * TokenService - JWT Token Management
 *
 * This service handles all JWT token operations including generation, verification, and validation.
 *
 * Following SOLID Principles:
 * - Single Responsibility: Only handles token-related operations
 * - Dependency Inversion: Implements ITokenService interface
 * - Open/Closed: Extensible for different token types without modification
 *
 * Security Features:
 * - Separate access and refresh tokens with different expiration times
 * - Secure token signing with environment-specific secrets
 * - Token verification with proper error handling
 *
 * @class TokenService
 * @implements {ITokenService}
 */

import jwt from "jsonwebtoken";
import config from "../../../../shared/config";
import {ITokenService, ITokenPayload, ITokenPair} from "../interfaces";
import {AuthenticationError} from "../../../../shared/middleware/errorHandler";

export class TokenService implements ITokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  /**
   * Initialize TokenService with configuration
   * Loads secrets and expiry times from environment configuration
   */
  constructor() {
    this.accessTokenSecret = config.jwt.secret;
    this.refreshTokenSecret = config.jwt.refreshSecret;
    this.accessTokenExpiry = config.jwt.expiresIn;
    this.refreshTokenExpiry = config.jwt.refreshExpiresIn;
  }

  /**
   * Generate JWT access and refresh token pair
   *
   * Access Token: Short-lived (7 days by default), used for API authentication
   * Refresh Token: Long-lived (30 days by default), used to obtain new access tokens
   *
   * @param {string} userId - User's unique identifier
   * @param {string} email - User's email address
   * @returns {ITokenPair} Token pair with access token, refresh token, and expiration
   *
   * @example
   * const tokens = tokenService.generateTokenPair('user123', 'user@example.com');
   * // Returns: { accessToken: '...', refreshToken: '...', expiresIn: 604800 }
   */
  generateTokenPair(userId: string, email: string): ITokenPair {
    const payload: ITokenPayload = {
      userId,
      email,
    };

    // Generate access token
    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: "sportification-api",
      audience: "sportification-client",
    } as jwt.SignOptions);

    // Generate refresh token
    const refreshToken = jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: "sportification-api",
      audience: "sportification-client",
    } as jwt.SignOptions);

    // Calculate expiration time in seconds
    const expiresIn = this.parseExpiryToSeconds(this.accessTokenExpiry);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Verify and decode JWT access token
   *
   * Validates the token signature, expiration, and claims.
   * Throws AuthenticationError if token is invalid, expired, or tampered.
   *
   * @param {string} token - JWT access token to verify
   * @returns {ITokenPayload} Decoded token payload containing userId and email
   * @throws {AuthenticationError} If token is invalid or expired
   *
   * @example
   * try {
   *   const payload = tokenService.verifyAccessToken(token);
   *   console.log(payload.userId); // Access user ID from token
   * } catch (error) {
   *   // Handle invalid token
   * }
   */
  verifyAccessToken(token: string): ITokenPayload {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: "sportification-api",
        audience: "sportification-client",
      }) as ITokenPayload;

      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError("Access token has expired");
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError("Invalid access token");
      } else {
        throw new AuthenticationError("Token verification failed");
      }
    }
  }

  /**
   * Verify and decode JWT refresh token
   *
   * Validates the refresh token for obtaining new access tokens.
   * Uses a separate secret to ensure refresh tokens cannot be forged from access tokens.
   *
   * @param {string} token - JWT refresh token to verify
   * @returns {ITokenPayload} Decoded token payload containing userId and email
   * @throws {AuthenticationError} If token is invalid or expired
   *
   * @example
   * try {
   *   const payload = tokenService.verifyRefreshToken(refreshToken);
   *   const newTokens = tokenService.generateTokenPair(payload.userId, payload.email);
   * } catch (error) {
   *   // Handle invalid refresh token
   * }
   */
  verifyRefreshToken(token: string): ITokenPayload {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: "sportification-api",
        audience: "sportification-client",
      }) as ITokenPayload;

      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError("Refresh token has expired");
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError("Invalid refresh token");
      } else {
        throw new AuthenticationError("Token verification failed");
      }
    }
  }

  /**
   * Decode token without verification
   *
   * Useful for inspecting token contents without validating signature.
   * WARNING: Do not use for authentication - this does not verify the token!
   *
   * @param {string} token - JWT token to decode
   * @returns {ITokenPayload | null} Decoded payload or null if invalid format
   *
   * @example
   * const payload = tokenService.decodeToken(token);
   * if (payload) {
   *   console.log('Token belongs to user:', payload.userId);
   * }
   */
  decodeToken(token: string): ITokenPayload | null {
    try {
      const decoded = jwt.decode(token) as ITokenPayload;

      if (!decoded || !decoded.userId || !decoded.email) {
        return null;
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse JWT expiry string to seconds
   *
   * Converts JWT expiry formats (e.g., '7d', '24h', '3600') to seconds.
   * Used for calculating token expiration time for clients.
   *
   * @private
   * @param {string} expiry - Expiry string (e.g., '7d', '24h', '3600')
   * @returns {number} Expiration time in seconds
   */
  private parseExpiryToSeconds(expiry: string): number {
    const timeUnit = expiry.slice(-1);
    const timeValue = parseInt(expiry.slice(0, -1), 10);

    switch (timeUnit) {
      case "d": // days
        return timeValue * 24 * 60 * 60;
      case "h": // hours
        return timeValue * 60 * 60;
      case "m": // minutes
        return timeValue * 60;
      case "s": // seconds
        return timeValue;
      default:
        // If no unit specified, assume seconds
        return parseInt(expiry, 10);
    }
  }
}
