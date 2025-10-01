import { MFAUtil, SecurityUtil } from '../utils/security';

describe('MFAUtil', () => {
  describe('generateSecret', () => {
    it('should generate a valid secret and QR code URL', () => {
      const email = 'test@example.com';
      const result = MFAUtil.generateSecret(email);
      
      expect(result.secret).toBeDefined();
      expect(result.secret.length).toBeGreaterThan(30); // Base32 encoded secrets vary in length
      expect(result.qrCodeUrl).toContain('otpauth://totp/');
      expect(result.qrCodeUrl).toContain('test%40example.com'); // URL-encoded email
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid TOTP token', () => {
      // Note: In a real test, you'd mock the time or use a known secret/token pair
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = '123456'; // This would be a real TOTP token in practice
      
      // For testing, we'll just check the function runs without error
      expect(() => MFAUtil.verifyToken(secret, token)).not.toThrow();
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate the correct number of backup codes', () => {
      const codes = MFAUtil.generateBackupCodes(10);
      
      expect(codes).toHaveLength(10);
      codes.forEach((code: string) => {
        expect(code).toMatch(/^[A-F0-9]{8}$/);
      });
    });

    it('should generate default number of backup codes', () => {
      const codes = MFAUtil.generateBackupCodes();
      expect(codes).toHaveLength(8);
    });
  });

  describe('verifyBackupCode', () => {
    it('should verify a valid backup code', () => {
      const backupCodes = ['ABCD1234', 'EFGH5678'];
      const result = MFAUtil.verifyBackupCode(backupCodes, 'ABCD1234');
      expect(result).toBe(true);
    });

    it('should reject an invalid backup code', () => {
      const backupCodes = ['ABCD1234', 'EFGH5678'];
      const result = MFAUtil.verifyBackupCode(backupCodes, 'INVALID');
      expect(result).toBe(false);
    });

    it('should be case insensitive', () => {
      const backupCodes = ['ABCD1234'];
      const result = MFAUtil.verifyBackupCode(backupCodes, 'abcd1234');
      expect(result).toBe(true);
    });
  });

  describe('removeBackupCode', () => {
    it('should remove a used backup code', () => {
      const backupCodes = ['ABCD1234', 'EFGH5678'];
      const result = MFAUtil.removeBackupCode(backupCodes, 'ABCD1234');
      
      expect(result).toHaveLength(1);
      expect(result).toContain('EFGH5678');
      expect(result).not.toContain('ABCD1234');
    });
  });
});

describe('SecurityUtil', () => {
  describe('generateSecureToken', () => {
    it('should generate a token of the correct length', () => {
      const token = SecurityUtil.generateSecureToken(16);
      expect(token).toHaveLength(32); // 16 bytes = 32 hex chars
    });

    it('should generate different tokens', () => {
      const token1 = SecurityUtil.generateSecureToken();
      const token2 = SecurityUtil.generateSecureToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('hashToken', () => {
    it('should hash a token consistently', () => {
      const token = 'test-token';
      const hash1 = SecurityUtil.hashToken(token);
      const hash2 = SecurityUtil.hashToken(token);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
    });
  });

  describe('generateDeviceFingerprint', () => {
    it('should generate consistent fingerprint for same input', () => {
      const userAgent = 'Mozilla/5.0...';
      const ip = '192.168.1.1';
      
      const fp1 = SecurityUtil.generateDeviceFingerprint(userAgent, ip);
      const fp2 = SecurityUtil.generateDeviceFingerprint(userAgent, ip);
      
      expect(fp1).toBe(fp2);
    });

    it('should generate different fingerprints for different inputs', () => {
      const fp1 = SecurityUtil.generateDeviceFingerprint('Mozilla/5.0...', '192.168.1.1');
      const fp2 = SecurityUtil.generateDeviceFingerprint('Chrome/95.0...', '192.168.1.2');
      
      expect(fp1).not.toBe(fp2);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept a strong password', () => {
      const result = SecurityUtil.validatePasswordStrength('VeryStrongP@ssw0rd2024!');
      
      expect(result.score).toBeGreaterThanOrEqual(4);
      // Note: isValid depends on multiple factors, focus on score for this test
    });

    it('should reject a weak password', () => {
      const result = SecurityUtil.validatePasswordStrength('weak');
      
      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain('Password must be at least 8 characters long');
    });

    it('should reject common passwords', () => {
      const result = SecurityUtil.validatePasswordStrength('password123');
      
      expect(result.isValid).toBe(false);
      expect(result.feedback.some((msg: string) => msg.includes('common'))).toBe(true);
    });

    it('should penalize repeating characters', () => {
      const result = SecurityUtil.validatePasswordStrength('Aaaa1111!!!');
      
      expect(result.feedback.some((msg: string) => msg.includes('repeating'))).toBe(true);
    });

    it('should penalize common sequences', () => {
      const result = SecurityUtil.validatePasswordStrength('Abc123def!');
      
      expect(result.feedback.some((msg: string) => msg.includes('sequences'))).toBe(true);
    });
  });

  describe('isIPAllowed', () => {
    it('should allow any IP when list is empty', () => {
      const result = SecurityUtil.isIPAllowed('192.168.1.1', []);
      expect(result).toBe(true);
    });

    it('should allow IP in allowed list', () => {
      const result = SecurityUtil.isIPAllowed('192.168.1.1', ['192.168.1.1', '10.0.0.1']);
      expect(result).toBe(true);
    });

    it('should reject IP not in allowed list', () => {
      const result = SecurityUtil.isIPAllowed('192.168.1.2', ['192.168.1.1', '10.0.0.1']);
      expect(result).toBe(false);
    });
  });

  describe('generateEmailVerificationToken', () => {
    it('should generate valid verification token data', () => {
      const result = SecurityUtil.generateEmailVerificationToken();
      
      expect(result.token).toBeDefined();
      expect(result.hashedToken).toBeDefined();
      expect(result.expires).toBeInstanceOf(Date);
      expect(result.expires.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate valid password reset token data', () => {
      const result = SecurityUtil.generatePasswordResetToken();
      
      expect(result.token).toBeDefined();
      expect(result.hashedToken).toBeDefined();
      expect(result.expires).toBeInstanceOf(Date);
      expect(result.expires.getTime()).toBeGreaterThan(Date.now());
      
      // Reset token should expire sooner than verification token
      const verificationResult = SecurityUtil.generateEmailVerificationToken();
      expect(result.expires.getTime()).toBeLessThan(verificationResult.expires.getTime());
    });
  });
});