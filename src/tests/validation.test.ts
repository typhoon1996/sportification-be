import { isValidEmail, isValidPassword, isValidObjectId } from '../shared/middleware/validation';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
        'simple@test.io',
      ];

      validEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user.domain.com',
        'user@@domain.com',
        '',
        'user @domain.com',
        'user@domain',
        'user@.com',
      ];

      invalidEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('isValidPassword', () => {
    it('should validate strong passwords', () => {
      const validPasswords = [
        'Password123',
        'MyStr0ngPass',
        'Complex1Password',
        'Test123Word',
        'Secure9Pass',
        'Admin123',
        'User9Test',
      ];

      validPasswords.forEach((password) => {
        expect(isValidPassword(password)).toBe(true);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'password', // No uppercase or number
        'PASSWORD', // No lowercase or number
        '12345678', // No letters
        'Pass123', // Too short (7 chars)
        'Pass@', // Too short
        'password123', // No uppercase
        'PASSWORD123', // No lowercase
        'Password', // No number
        '', // Empty
      ];

      weakPasswords.forEach((password) => {
        expect(isValidPassword(password)).toBe(false);
      });
    });
  });

  describe('isValidObjectId', () => {
    it('should validate correct MongoDB ObjectIds', () => {
      const validObjectIds = [
        '507f1f77bcf86cd799439011',
        '507f191e810c19729de860ea',
        '5f8d0d5b4f7a8c2c0c8a4e6b',
        '60a8c4f1e8e9c2a4d0f5e8b7',
        '61b5f3e2a9c8d7e6f0a2b3c4',
      ];

      validObjectIds.forEach((id) => {
        expect(isValidObjectId(id)).toBe(true);
      });
    });

    it('should reject invalid ObjectIds', () => {
      const invalidObjectIds = [
        'invalid-id',
        '123',
        '507f1f77bcf86cd79943901', // Too short
        '507f1f77bcf86cd799439011z', // Invalid character
        '',
        '507f1f77bcf86cd799439011a1', // Too long
      ];

      invalidObjectIds.forEach((id) => {
        expect(isValidObjectId(id)).toBe(false);
      });

      // Test null and undefined separately
      expect(isValidObjectId(null as any)).toBe(false);
      expect(isValidObjectId(undefined as any)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined inputs gracefully', () => {
      expect(isValidEmail(null as any)).toBe(false);
      expect(isValidEmail(undefined as any)).toBe(false);
      expect(isValidPassword(null as any)).toBe(false);
      expect(isValidPassword(undefined as any)).toBe(false);
      expect(isValidObjectId(null as any)).toBe(false);
      expect(isValidObjectId(undefined as any)).toBe(false);
    });

    it('should handle non-string inputs', () => {
      expect(isValidEmail(123 as any)).toBe(false);
      expect(isValidPassword(123 as any)).toBe(false);
      expect(isValidObjectId(123 as any)).toBe(false);
    });
  });
});
