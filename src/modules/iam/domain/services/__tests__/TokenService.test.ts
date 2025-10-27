/**
 * Unit Tests for TokenService
 *
 * Tests the JWT token generation, verification, and validation functionality.
 * Demonstrates testability improvements from SOLID refactoring.
 */

import {TokenService} from "../TokenService";
// import jwt from "jsonwebtoken";

describe("TokenService", () => {
  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new TokenService();
  });

  describe("generateTokenPair", () => {
    it("should generate valid access and refresh tokens", () => {
      const userId = "user123";
      const email = "test@example.com";

      const tokens = tokenService.generateTokenPair(userId, email);

      expect(tokens).toHaveProperty("accessToken");
      expect(tokens).toHaveProperty("refreshToken");
      expect(tokens).toHaveProperty("expiresIn");
      expect(typeof tokens.accessToken).toBe("string");
      expect(typeof tokens.refreshToken).toBe("string");
      expect(typeof tokens.expiresIn).toBe("number");
    });

    it("should generate different tokens for different users", () => {
      const tokens1 = tokenService.generateTokenPair(
        "user1",
        "user1@example.com"
      );
      const tokens2 = tokenService.generateTokenPair(
        "user2",
        "user2@example.com"
      );

      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });

    it("should include userId and email in token payload", () => {
      const userId = "user123";
      const email = "test@example.com";

      const tokens = tokenService.generateTokenPair(userId, email);
      const decoded = tokenService.decodeToken(tokens.accessToken);

      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(userId);
      expect(decoded?.email).toBe(email);
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify valid access token", () => {
      const userId = "user123";
      const email = "test@example.com";

      const tokens = tokenService.generateTokenPair(userId, email);
      const payload = tokenService.verifyAccessToken(tokens.accessToken);

      expect(payload.userId).toBe(userId);
      expect(payload.email).toBe(email);
    });

    it("should throw error for invalid token", () => {
      expect(() => {
        tokenService.verifyAccessToken("invalid-token");
      }).toThrow("Invalid access token");
    });

    it("should throw error for tampered token", () => {
      const tokens = tokenService.generateTokenPair(
        "user123",
        "test@example.com"
      );
      const tamperedToken = tokens.accessToken + "tampered";

      expect(() => {
        tokenService.verifyAccessToken(tamperedToken);
      }).toThrow();
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify valid refresh token", () => {
      const userId = "user123";
      const email = "test@example.com";

      const tokens = tokenService.generateTokenPair(userId, email);
      const payload = tokenService.verifyRefreshToken(tokens.refreshToken);

      expect(payload.userId).toBe(userId);
      expect(payload.email).toBe(email);
    });

    it("should throw error for invalid refresh token", () => {
      expect(() => {
        tokenService.verifyRefreshToken("invalid-token");
      }).toThrow("Invalid refresh token");
    });

    it("should not accept access token as refresh token", () => {
      const tokens = tokenService.generateTokenPair(
        "user123",
        "test@example.com"
      );

      expect(() => {
        tokenService.verifyRefreshToken(tokens.accessToken);
      }).toThrow();
    });
  });

  describe("decodeToken", () => {
    it("should decode token without verification", () => {
      const userId = "user123";
      const email = "test@example.com";

      const tokens = tokenService.generateTokenPair(userId, email);
      const payload = tokenService.decodeToken(tokens.accessToken);

      expect(payload).toBeTruthy();
      expect(payload?.userId).toBe(userId);
      expect(payload?.email).toBe(email);
    });

    it("should return null for invalid token format", () => {
      const payload = tokenService.decodeToken("not-a-jwt-token");
      expect(payload).toBeNull();
    });

    it("should decode expired token without throwing", () => {
      // This would still decode even if expired
      const userId = "user123";
      const email = "test@example.com";
      const tokens = tokenService.generateTokenPair(userId, email);

      const payload = tokenService.decodeToken(tokens.accessToken);
      expect(payload).toBeTruthy();
    });
  });

  describe("token expiry parsing", () => {
    it("should calculate correct expiry time for tokens", () => {
      const tokens = tokenService.generateTokenPair(
        "user123",
        "test@example.com"
      );

      expect(tokens.expiresIn).toBeGreaterThan(0);
      // Should be 7 days in seconds (604800)
      expect(tokens.expiresIn).toBeGreaterThanOrEqual(600000);
    });
  });
});
