import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { User } from '../modules/users/domain/models/User';
import { Profile } from '../modules/users/domain/models/Profile';
import app from '../app';

describe('Enhanced Authentication Endpoints', () => {
  let mongoServer: MongoMemoryServer;
  let testApp: any;
  let userToken: string;
  let testUser: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);

    // Create test app instance
    testApp = new app().app;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});
    await Profile.deleteMany({});

    // Create test user and get token
    const testProfile = new Profile({
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      user: null,
    });

    testUser = new User({
      email: 'test@example.com',
      password: 'TestPassword123!',
      profile: testProfile._id,
      isEmailVerified: true,
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en',
      },
    });

    testProfile.user = testUser._id;
    await Promise.all([testUser.save(), testProfile.save()]);

    // Login to get token
    const loginResponse = await request(testApp).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'TestPassword123!',
    });

    userToken = loginResponse.body.data.tokens.accessToken;
  });

  describe('POST /auth/forgot-password', () => {
    it('should handle forgot password request for existing user', async () => {
      const response = await request(testApp).post('/api/v1/auth/forgot-password').send({
        email: 'test@example.com',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link has been sent');
    });

    it('should handle forgot password request for non-existing user', async () => {
      const response = await request(testApp).post('/api/v1/auth/forgot-password').send({
        email: 'nonexistent@example.com',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link has been sent');
    });

    it('should reject request without email', async () => {
      const response = await request(testApp).post('/api/v1/auth/forgot-password').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should reject reset with invalid token', async () => {
      const response = await request(testApp).post('/api/v1/auth/reset-password').send({
        token: 'invalid-token',
        newPassword: 'NewPassword123!',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('invalid or has expired');
    });

    it('should reject weak password', async () => {
      // First generate a reset token
      await request(testApp)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@example.com' });

      const response = await request(testApp).post('/api/v1/auth/reset-password').send({
        token: 'some-token',
        newPassword: 'weak',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('at least 8 characters');
    });
  });

  describe('POST /auth/mfa/setup', () => {
    it('should setup MFA for authenticated user', async () => {
      const response = await request(testApp)
        .post('/api/v1/auth/mfa/setup')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.secret).toBeDefined();
      expect(response.body.data.qrCode).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(testApp).post('/api/v1/auth/mfa/setup');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject if MFA already enabled', async () => {
      // First setup MFA
      await request(testApp)
        .post('/api/v1/auth/mfa/setup')
        .set('Authorization', `Bearer ${userToken}`);

      // Enable MFA
      testUser.mfaSettings = { isEnabled: true, secret: 'test-secret', backupCodes: [] };
      await testUser.save();

      const response = await request(testApp)
        .post('/api/v1/auth/mfa/setup')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/mfa/verify', () => {
    it('should require secret and token', async () => {
      const response = await request(testApp)
        .post('/api/v1/auth/mfa/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid token', async () => {
      const response = await request(testApp)
        .post('/api/v1/auth/mfa/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          secret: 'JBSWY3DPEHPK3PXP',
          token: '000000',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /auth/security', () => {
    it('should return security settings for authenticated user', async () => {
      const response = await request(testApp)
        .get('/api/v1/auth/security')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('mfaEnabled');
      expect(response.body.data).toHaveProperty('socialLogins');
      expect(response.body.data).toHaveProperty('lastLoginAt');
      expect(response.body.data).toHaveProperty('allowedIPs');
    });

    it('should require authentication', async () => {
      const response = await request(testApp).get('/api/v1/auth/security');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /auth/security', () => {
    it('should update allowed IPs', async () => {
      const response = await request(testApp)
        .patch('/api/v1/auth/security')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          allowedIPs: ['192.168.1.1', '10.0.0.1'],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify the update
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.securitySettings?.allowedIPs).toEqual(['192.168.1.1', '10.0.0.1']);
    });

    it('should reject invalid IP addresses', async () => {
      const response = await request(testApp)
        .patch('/api/v1/auth/security')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          allowedIPs: ['invalid-ip', '999.999.999.999'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid IP addresses');
    });
  });

  describe('POST /auth/social/link', () => {
    it('should link social account', async () => {
      const response = await request(testApp)
        .post('/api/v1/auth/social/link')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          provider: 'google',
          providerId: '12345',
          email: 'test@gmail.com',
          name: 'Test User',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.socialLogins).toHaveLength(1);
    });

    it('should reject duplicate provider', async () => {
      // First link
      await request(testApp)
        .post('/api/v1/auth/social/link')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          provider: 'google',
          providerId: '12345',
          email: 'test@gmail.com',
          name: 'Test User',
        });

      // Try to link again
      const response = await request(testApp)
        .post('/api/v1/auth/social/link')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          provider: 'google',
          providerId: '67890',
          email: 'test2@gmail.com',
          name: 'Test User 2',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/social/unlink', () => {
    beforeEach(async () => {
      // Link a social account first
      testUser.socialLogins = [
        {
          provider: 'google',
          providerId: '12345',
          email: 'test@gmail.com',
          name: 'Test User',
        },
      ];
      await testUser.save();
    });

    it('should unlink social account', async () => {
      const response = await request(testApp)
        .post('/api/v1/auth/social/unlink')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          provider: 'google',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.socialLogins).toHaveLength(0);
    });

    it('should reject unlinking last authentication method', async () => {
      // Remove password to make social login the only method
      testUser.password = undefined;
      await testUser.save();

      const response = await request(testApp)
        .post('/api/v1/auth/social/unlink')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          provider: 'google',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('only authentication method');
    });
  });
});
