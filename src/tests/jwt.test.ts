import { JWTUtil } from '../utils/jwt';

describe('JWT Utility', () => {
  const testUserId = '507f1f77bcf86cd799439011';
  const testEmail = 'test@example.com';

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = JWTUtil.generateAccessToken(testUserId, testEmail);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = JWTUtil.generateRefreshToken(testUserId, testEmail);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = JWTUtil.generateAccessToken(testUserId, testEmail);
      
      const decoded = JWTUtil.verifyAccessToken(token);
      
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.email).toBe(testEmail);
      expect(decoded.type).toBe('access');
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        JWTUtil.verifyAccessToken('invalid-token');
      }).toThrow('Invalid token');
    });

    it('should throw error for refresh token used as access token', () => {
      const refreshToken = JWTUtil.generateRefreshToken(testUserId, testEmail);
      
      expect(() => {
        JWTUtil.verifyAccessToken(refreshToken);
      }).toThrow('Invalid token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = JWTUtil.generateRefreshToken(testUserId, testEmail);
      
      const decoded = JWTUtil.verifyRefreshToken(token);
      
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.email).toBe(testEmail);
      expect(decoded.type).toBe('refresh');
    });

    it('should throw error for access token used as refresh token', () => {
      const accessToken = JWTUtil.generateAccessToken(testUserId, testEmail);
      
      expect(() => {
        JWTUtil.verifyRefreshToken(accessToken);
      }).toThrow('Invalid refresh token');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const header = `Bearer ${token}`;
      
      const extracted = JWTUtil.extractTokenFromHeader(header);
      
      expect(extracted).toBe(token);
    });

    it('should return null for invalid header format', () => {
      expect(JWTUtil.extractTokenFromHeader('Invalid header')).toBeNull();
      expect(JWTUtil.extractTokenFromHeader('Basic token')).toBeNull();
      expect(JWTUtil.extractTokenFromHeader('')).toBeNull();
      expect(JWTUtil.extractTokenFromHeader(undefined)).toBeNull();
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = JWTUtil.generateTokenPair(testUserId, testEmail);
      
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
      
      // Verify both tokens are valid
      const accessDecoded = JWTUtil.verifyAccessToken(tokens.accessToken);
      const refreshDecoded = JWTUtil.verifyRefreshToken(tokens.refreshToken);
      
      expect(accessDecoded.userId).toBe(testUserId);
      expect(refreshDecoded.userId).toBe(testUserId);
    });
  });
});