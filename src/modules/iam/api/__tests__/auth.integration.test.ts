/**
 * Integration Tests for Authentication Endpoints
 *
 * Tests the complete authentication flow including:
 * - User registration
 * - Login with email/password
 * - Token refresh
 * - Logout
 * - Password change
 * - Account deactivation
 */

import request from "supertest";
import {Express} from "express";
import {User} from "../../../../users/domain/models/User";
import {Profile} from "../../../../users/domain/models/Profile";

// Mock app will be created in beforeAll
let app: Express;
let authToken: string;
let refreshToken: string;
let userId: string;

// Test user credentials
const testUser = {
  email: "test@integration.com",
  password: "TestPassword123!",
  firstName: "Test",
  lastName: "User",
  username: "testuser",
};

describe("Authentication Integration Tests", () => {
  beforeAll(async () => {
    // Initialize app
    const {default: App} = await import("../../../../../app");
    const appInstance = new App();
    app = appInstance.getApp();

    // Clean up test data
    await User.deleteMany({email: testUser.email});
    await Profile.deleteMany({username: testUser.username});
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({email: testUser.email});
    await Profile.deleteMany({username: testUser.username});
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("tokens");
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.tokens).toHaveProperty("accessToken");
      expect(response.body.data.tokens).toHaveProperty("refreshToken");

      // Save tokens for subsequent tests
      authToken = response.body.data.tokens.accessToken;
      refreshToken = response.body.data.tokens.refreshToken;
      userId = response.body.data.user.id;
    });

    it("should reject registration with duplicate email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(testUser)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already exists");
    });

    it("should reject registration with weak password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          ...testUser,
          email: "another@test.com",
          password: "weak",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject registration with invalid email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          ...testUser,
          email: "invalid-email",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("tokens");
      expect(response.body.data.user.email).toBe(testUser.email);

      // Update tokens
      authToken = response.body.data.tokens.accessToken;
      refreshToken = response.body.data.tokens.refreshToken;
    });

    it("should reject login with invalid password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: "WrongPassword123!",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should reject login with non-existent email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "nonexistent@test.com",
          password: testUser.password,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/auth/profile", () => {
    it("should get authenticated user profile", async () => {
      const response = await request(app)
        .get("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.profile).toBeDefined();
    });

    it("should reject unauthenticated request", async () => {
      const response = await request(app).get("/api/v1/auth/profile").expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should reject request with invalid token", async () => {
      const response = await request(app)
        .get("/api/v1/auth/profile")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/refresh-token", () => {
    it("should refresh access token with valid refresh token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh-token")
        .send({refreshToken})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("tokens");
      expect(response.body.data.tokens).toHaveProperty("accessToken");
      expect(response.body.data.tokens).toHaveProperty("refreshToken");

      // Update tokens
      authToken = response.body.data.tokens.accessToken;
      refreshToken = response.body.data.tokens.refreshToken;
    });

    it("should reject invalid refresh token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh-token")
        .send({refreshToken: "invalid-token"})
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/v1/auth/change-password", () => {
    const newPassword = "NewTestPassword123!";

    it("should change password with valid credentials", async () => {
      const response = await request(app)
        .put("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify new password works
      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);

      // Update tokens
      authToken = loginResponse.body.data.tokens.accessToken;
      refreshToken = loginResponse.body.data.tokens.refreshToken;

      // Verify old password doesn't work
      await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(401);
    });

    it("should reject password change with incorrect current password", async () => {
      const response = await request(app)
        .put("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          currentPassword: "WrongPassword123!",
          newPassword: "AnotherPassword123!",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should reject weak new password", async () => {
      const response = await request(app)
        .put("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          currentPassword: newPassword,
          newPassword: "weak",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("should logout successfully", async () => {
      const response = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({refreshToken})
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify refresh token is invalidated
      await request(app)
        .post("/api/v1/auth/refresh-token")
        .send({refreshToken})
        .expect(401);
    });
  });

  describe("DELETE /api/v1/auth/deactivate", () => {
    beforeAll(async () => {
      // Login again to get fresh tokens
      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: "NewTestPassword123!",
        });

      authToken = loginResponse.body.data.tokens.accessToken;
    });

    it("should deactivate account with valid password", async () => {
      const response = await request(app)
        .delete("/api/v1/auth/deactivate")
        .set("Authorization", `Bearer ${authToken}`)
        .send({password: "NewTestPassword123!"})
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user cannot login
      await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: "NewTestPassword123!",
        })
        .expect(401);
    });
  });
});
