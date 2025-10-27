import jwt, {SignOptions} from "jsonwebtoken";
import {StringValue} from "ms";
import {IJWTPayload} from "../../types";
import config from "../../config";

/**
 * JWT Utility class for handling JSON Web Token operations
 * Provides methods for generating, verifying, and refreshing JWT tokens
 */
export class JWTUtil {
  /**
   * Generate an access token for user authentication
   *
   * @param userId - The unique identifier of the user
   * @param email - The email address of the user
   * @return A signed JWT access token
   * @example
   * const token = JWTUtil.generateAccessToken('user123', 'user@example.com');
   */
  static generateAccessToken(userId: string, email: string): string {
    const payload: IJWTPayload = {
      userId,
      email,
      type: "access",
    };

    const options: SignOptions = {
      expiresIn: config.jwt.expiresIn as StringValue | number,
      issuer: "sportification-api",
      audience: "sportification-client",
    };

    return jwt.sign(payload, config.jwt.secret, options);
  }

  /**
   * Generate a refresh token for obtaining new access tokens
   *
   * @param userId - The unique identifier of the user
   * @param email - The email address of the user
   * @return A signed JWT refresh token with longer expiration
   * @example
   * const refreshToken = JWTUtil.generateRefreshToken('user123', 'user@example.com');
   */
  static generateRefreshToken(userId: string, email: string): string {
    const payload: IJWTPayload = {
      userId,
      email,
      type: "refresh",
    };

    const options: SignOptions = {
      expiresIn: config.jwt.refreshExpiresIn as StringValue | number,
      issuer: "sportification-api",
      audience: "sportification-client",
    };

    return jwt.sign(payload, config.jwt.refreshSecret, options);
  }

  /**
   * Verify and decode an access token
   *
   * @param token - The JWT access token to verify
   * @return The decoded JWT payload
   * @throws {Error} If token is invalid, expired, or wrong type
   * @example
   * try {
   *   const payload = JWTUtil.verifyAccessToken(token);
   *   console.log(payload.userId);
   * } catch (error) {
   *   console.error('Invalid token');
   * }
   */
  static verifyAccessToken(token: string): IJWTPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: "sportification-api",
        audience: "sportification-client",
      }) as IJWTPayload;

      if (decoded.type !== "access") {
        throw new Error("Invalid token type");
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid token");
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Token expired");
      }
      throw error;
    }
  }

  /**
   * Verify and decode a refresh token
   *
   * @param token - The JWT refresh token to verify
   * @return The decoded JWT payload
   * @throws {Error} If token is invalid, expired, or wrong type
   * @example
   * try {
   *   const payload = JWTUtil.verifyRefreshToken(refreshToken);
   *   // Generate new access token
   * } catch (error) {
   *   // Require user to log in again
   * }
   */
  static verifyRefreshToken(token: string): IJWTPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret, {
        issuer: "sportification-api",
        audience: "sportification-client",
      }) as IJWTPayload;

      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid refresh token");
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Refresh token expired");
      }
      throw error;
    }
  }

  // Extract token from authorization header
  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.substring(7);
  }

  // Generate token pair
  static generateTokenPair(userId: string, email: string) {
    return {
      accessToken: this.generateAccessToken(userId, email),
      refreshToken: this.generateRefreshToken(userId, email),
    };
  }
}
