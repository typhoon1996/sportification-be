/**
 * Integration Tests for API Keys Endpoints
 *
 * Tests the complete API key lifecycle including:
 * - API key creation
 * - Listing API keys
 * - Getting API key details
 * - Updating API key
 * - Using API key for authentication
 * - Regenerating API key
 * - Deleting API key
 */

import request from "supertest";
import {Express} from "express";
import {User} from "../../../../users/domain/models/User";
import {Profile} from "../../../../users/domain/models/Profile";
import {ApiKey} from "../../../domain/models/ApiKey";

let app: Express;
let authToken: string;
let userId: string;
let apiKey: string;
let apiKeyId: string;

const testUser = {
  email: "apikey@integration.com",
  password: "TestPassword123!",
  firstName: "APIKey",
  lastName: "User",
  username: "apikeyuser",
};

describe("API Keys Integration Tests", () => {
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
    userId = response.body.data.user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await ApiKey.deleteMany({userId});
    await User.deleteMany({email: testUser.email});
    await Profile.deleteMany({username: testUser.username});
  });

  describe("POST /api/v1/api-keys", () => {
    it("should create an API key successfully", async () => {
      const response = await request(app)
        .post("/api/v1/api-keys")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test API Key",
          permissions: ["read:matches", "read:tournaments"],
          expiresInDays: 90,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("apiKey");
      expect(response.body.data).toHaveProperty("key");
      expect(response.body.data.apiKey.name).toBe("Test API Key");
      expect(response.body.data.apiKey.permissions).toEqual([
        "read:matches",
        "read:tournaments",
      ]);
      expect(response.body.data.key).toMatch(/^sk_/);

      // Save for next tests
      apiKey = response.body.data.key;
      apiKeyId = response.body.data.apiKey._id;
    });

    it("should create API key with IP restrictions", async () => {
      const response = await request(app)
        .post("/api/v1/api-keys")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "IP Restricted Key",
          permissions: ["read:users"],
          allowedIPs: ["192.168.1.100", "10.0.0.1"],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.apiKey.allowedIPs).toEqual([
        "192.168.1.100",
        "10.0.0.1",
      ]);
    });

    it("should reject creation without authentication", async () => {
      await request(app)
        .post("/api/v1/api-keys")
        .send({
          name: "Unauthorized Key",
        })
        .expect(401);
    });

    it("should reject creation with invalid permissions", async () => {
      await request(app)
        .post("/api/v1/api-keys")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Invalid Key",
          permissions: ["invalid:permission"],
        })
        .expect(400);
    });
  });

  describe("GET /api/v1/api-keys", () => {
    it("should list user's API keys", async () => {
      const response = await request(app)
        .get("/api/v1/api-keys")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("apiKeys");
      expect(Array.isArray(response.body.data.apiKeys)).toBe(true);
      expect(response.body.data.apiKeys.length).toBeGreaterThanOrEqual(2);
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get("/api/v1/api-keys?page=1&limit=1")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.apiKeys.length).toBeLessThanOrEqual(1);
      expect(response.body.data).toHaveProperty("pagination");
    });
  });

  describe("GET /api/v1/api-keys/stats", () => {
    it("should get API key statistics", async () => {
      const response = await request(app)
        .get("/api/v1/api-keys/stats")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("total");
      expect(response.body.data).toHaveProperty("active");
      expect(response.body.data.total).toBeGreaterThanOrEqual(2);
    });
  });

  describe("GET /api/v1/api-keys/:keyId", () => {
    it("should get specific API key details", async () => {
      const response = await request(app)
        .get(`/api/v1/api-keys/${apiKeyId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("apiKey");
      expect(response.body.data.apiKey._id).toBe(apiKeyId);
      expect(response.body.data.apiKey.name).toBe("Test API Key");
    });

    it("should reject access to other user's API key", async () => {
      // Create another user
      const otherUser = {
        email: "other@integration.com",
        password: "TestPassword123!",
        firstName: "Other",
        lastName: "User",
        username: "otheruser",
      };

      await User.deleteMany({email: otherUser.email});
      await Profile.deleteMany({username: otherUser.username});

      const registerResponse = await request(app)
        .post("/api/v1/auth/register")
        .send(otherUser);

      const otherToken = registerResponse.body.data.tokens.accessToken;

      await request(app)
        .get(`/api/v1/api-keys/${apiKeyId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .expect(404);

      // Clean up
      await User.deleteMany({email: otherUser.email});
      await Profile.deleteMany({username: otherUser.username});
    });
  });

  describe("PATCH /api/v1/api-keys/:keyId", () => {
    it("should update API key", async () => {
      const response = await request(app)
        .patch(`/api/v1/api-keys/${apiKeyId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated API Key",
          permissions: ["read:matches", "write:matches"],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.apiKey.name).toBe("Updated API Key");
      expect(response.body.data.apiKey.permissions).toContain("write:matches");
    });

    it("should deactivate API key", async () => {
      const response = await request(app)
        .patch(`/api/v1/api-keys/${apiKeyId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          isActive: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.apiKey.isActive).toBe(false);

      // Reactivate for next tests
      await request(app)
        .patch(`/api/v1/api-keys/${apiKeyId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          isActive: true,
        });
    });
  });

  describe("POST /api/v1/api-keys/:keyId/regenerate", () => {
    it("should regenerate API key", async () => {
      const oldKey = apiKey;

      const response = await request(app)
        .post(`/api/v1/api-keys/${apiKeyId}/regenerate`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("apiKey");
      expect(response.body.data).toHaveProperty("key");
      expect(response.body.data.key).not.toBe(oldKey);
      expect(response.body.data.key).toMatch(/^sk_/);

      // Update apiKey for delete test
      apiKey = response.body.data.key;
    });
  });

  describe("DELETE /api/v1/api-keys/:keyId", () => {
    it("should delete API key", async () => {
      const response = await request(app)
        .delete(`/api/v1/api-keys/${apiKeyId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify key is deleted
      await request(app)
        .get(`/api/v1/api-keys/${apiKeyId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });

    it("should reject deleting already deleted key", async () => {
      await request(app)
        .delete(`/api/v1/api-keys/${apiKeyId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
