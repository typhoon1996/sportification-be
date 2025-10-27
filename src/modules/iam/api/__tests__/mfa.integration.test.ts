/**
 * Integration Tests for MFA Endpoints
 *
 * Tests the complete MFA flow including:
 * - MFA setup
 * - MFA enable with token verification
 * - Login with MFA
 * - MFA disable
 * - Backup code usage
 * - Backup code regeneration
 */

import request from "supertest";
import {Express} from "express";
import speakeasy from "speakeasy";
import {User} from "../../../../users/domain/models/User";
import {Profile} from "../../../../users/domain/models/Profile";

let app: Express;
let authToken: string;
let refreshToken: string;
let userId: string;
let mfaSecret: string;
let backupCodes: string[];

const testUser = {
  email: "mfa@integration.com",
  password: "TestPassword123!",
  firstName: "MFA",
  lastName: "User",
  username: "mfauser",
};

describe("MFA Integration Tests", () => {
  beforeAll(async () => {
    // Initialize app
    const {default: App} = await import("../../../../../app");
    const appInstance = new App();
    app = appInstance.getApp();

    // Clean up test data
    await User.deleteMany({email: testUser.email});
    await Profile.deleteMany({username: testUser.username});

    // Register user
    const response = await request(app).post("/api/v1/auth/register").send(testUser);

    authToken = response.body.data.tokens.accessToken;
    refreshToken = response.body.data.tokens.refreshToken;
    userId = response.body.data.user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({email: testUser.email});
    await Profile.deleteMany({username: testUser.username});
  });

  describe("GET /api/v1/mfa/setup", () => {
    it("should generate MFA setup data", async () => {
      const response = await request(app)
        .get("/api/v1/mfa/setup")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("secret");
      expect(response.body.data).toHaveProperty("qrCode");
      expect(response.body.data).toHaveProperty("backupCodes");
      expect(response.body.data.backupCodes).toHaveLength(10);

      // Save for next tests
      mfaSecret = response.body.data.secret;
      backupCodes = response.body.data.backupCodes;
    });

    it("should require authentication", async () => {
      await request(app).get("/api/v1/mfa/setup").expect(401);
    });
  });

  describe("POST /api/v1/mfa/enable", () => {
    it("should enable MFA with valid token", async () => {
      // Generate valid TOTP token
      const token = speakeasy.totp({
        secret: mfaSecret,
        encoding: "base32",
      });

      const response = await request(app)
        .post("/api/v1/mfa/enable")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          secret: mfaSecret,
          token,
          backupCodes,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("enabled successfully");
    });

    it("should reject invalid token", async () => {
      // Setup new MFA (previous one was enabled)
      const setupResponse = await request(app)
        .get("/api/v1/mfa/setup")
        .set("Authorization", `Bearer ${authToken}`);

      // Try to enable with invalid token
      await request(app)
        .post("/api/v1/mfa/enable")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          secret: setupResponse.body.data.secret,
          token: "000000",
          backupCodes: setupResponse.body.data.backupCodes,
        })
        .expect(400);
    });
  });

  describe("GET /api/v1/mfa/status", () => {
    it("should return MFA enabled status", async () => {
      const response = await request(app)
        .get("/api/v1/mfa/status")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isEnabled).toBe(true);
      expect(response.body.data.backupCodesCount).toBe(10);
    });
  });

  describe("MFA Login Flow", () => {
    it("should require MFA token during login", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      // Should return MFA required
      expect(response.body.data).toHaveProperty("requiresMFA");
      expect(response.body.data.requiresMFA).toBe(true);
      expect(response.body.data).toHaveProperty("userId");
    });

    it("should complete login with valid MFA token", async () => {
      // Generate valid TOTP token
      const token = speakeasy.totp({
        secret: mfaSecret,
        encoding: "base32",
      });

      const response = await request(app)
        .post("/api/v1/mfa/verify")
        .send({
          userId,
          token,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.verified).toBe(true);
      expect(response.body.data.usedBackupCode).toBe(false);
    });

    it("should reject invalid MFA token", async () => {
      await request(app)
        .post("/api/v1/mfa/verify")
        .send({
          userId,
          token: "000000",
        })
        .expect(401);
    });

    it("should accept backup code", async () => {
      const backupCode = backupCodes[0];

      const response = await request(app)
        .post("/api/v1/mfa/verify")
        .send({
          userId,
          token: backupCode,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.verified).toBe(true);
      expect(response.body.data.usedBackupCode).toBe(true);

      // Verify backup code count decreased
      const statusResponse = await request(app)
        .get("/api/v1/mfa/status")
        .set("Authorization", `Bearer ${authToken}`);

      expect(statusResponse.body.data.backupCodesCount).toBe(9);
    });
  });

  describe("POST /api/v1/mfa/backup-codes", () => {
    it("should regenerate backup codes with password", async () => {
      const response = await request(app)
        .post("/api/v1/mfa/backup-codes")
        .set("Authorization", `Bearer ${authToken}`)
        .send({password: testUser.password})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("backupCodes");
      expect(response.body.data.backupCodes).toHaveLength(10);

      // Update backup codes
      backupCodes = response.body.data.backupCodes;

      // Verify count reset to 10
      const statusResponse = await request(app)
        .get("/api/v1/mfa/status")
        .set("Authorization", `Bearer ${authToken}`);

      expect(statusResponse.body.data.backupCodesCount).toBe(10);
    });

    it("should reject without password", async () => {
      await request(app)
        .post("/api/v1/mfa/backup-codes")
        .set("Authorization", `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it("should reject with wrong password", async () => {
      await request(app)
        .post("/api/v1/mfa/backup-codes")
        .set("Authorization", `Bearer ${authToken}`)
        .send({password: "WrongPassword123!"})
        .expect(401);
    });
  });

  describe("POST /api/v1/mfa/disable", () => {
    it("should disable MFA with password", async () => {
      const response = await request(app)
        .post("/api/v1/mfa/disable")
        .set("Authorization", `Bearer ${authToken}`)
        .send({password: testUser.password})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("disabled successfully");

      // Verify MFA is disabled
      const statusResponse = await request(app)
        .get("/api/v1/mfa/status")
        .set("Authorization", `Bearer ${authToken}`);

      expect(statusResponse.body.data.isEnabled).toBe(false);
      expect(statusResponse.body.data.backupCodesCount).toBe(0);
    });

    it("should reject without password", async () => {
      await request(app)
        .post("/api/v1/mfa/disable")
        .set("Authorization", `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it("should allow login without MFA after disabling", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      // Should not require MFA
      expect(response.body.data).toHaveProperty("tokens");
      expect(response.body.data).not.toHaveProperty("requiresMFA");
    });
  });
});
