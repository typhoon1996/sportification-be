/**
 * Unit Tests for PasswordService
 *
 * Tests password hashing, comparison, and validation functionality.
 * Demonstrates how SOLID principles improve testability.
 */

import {PasswordService} from "../PasswordService";

describe("PasswordService", () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe("hashPassword", () => {
    it("should hash password successfully", async () => {
      const password = "TestPassword123";
      const hash = await passwordService.hashPassword(password);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[ab]\$/); // bcrypt hash format
    });

    it("should generate different hashes for same password", async () => {
      const password = "TestPassword123";
      const hash1 = await passwordService.hashPassword(password);
      const hash2 = await passwordService.hashPassword(password);

      expect(hash1).not.toBe(hash2); // bcrypt uses salt
    });

    it("should handle special characters in password", async () => {
      const password = "P@ssw0rd!#$%^&*()";
      const hash = await passwordService.hashPassword(password);

      expect(hash).toBeTruthy();
      expect(hash).toMatch(/^\$2[ab]\$/);
    });
  });

  describe("comparePassword", () => {
    it("should return true for matching password", async () => {
      const password = "TestPassword123";
      const hash = await passwordService.hashPassword(password);

      const isMatch = await passwordService.comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it("should return false for incorrect password", async () => {
      const password = "TestPassword123";
      const hash = await passwordService.hashPassword(password);

      const isMatch = await passwordService.comparePassword(
        "WrongPassword",
        hash
      );
      expect(isMatch).toBe(false);
    });

    it("should be case-sensitive", async () => {
      const password = "TestPassword123";
      const hash = await passwordService.hashPassword(password);

      const isMatch = await passwordService.comparePassword(
        "testpassword123",
        hash
      );
      expect(isMatch).toBe(false);
    });

    it("should handle invalid hash gracefully", async () => {
      const isMatch = await passwordService.comparePassword(
        "password",
        "invalid-hash"
      );
      expect(isMatch).toBe(false);
    });
  });

  describe("validatePasswordStrength", () => {
    it("should accept strong password", () => {
      const result = passwordService.validatePasswordStrength("StrongPass123");

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject password shorter than minimum length", () => {
      const result = passwordService.validatePasswordStrength("Short1");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must be at least 8 characters long"
      );
    });

    it("should reject password without uppercase letter", () => {
      const result = passwordService.validatePasswordStrength("lowercase123");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one uppercase letter"
      );
    });

    it("should reject password without lowercase letter", () => {
      const result = passwordService.validatePasswordStrength("UPPERCASE123");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one lowercase letter"
      );
    });

    it("should reject password without number", () => {
      const result = passwordService.validatePasswordStrength("NoNumbersHere");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one number"
      );
    });

    it("should reject common passwords", () => {
      const result = passwordService.validatePasswordStrength("Password123");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password is too common. Please choose a stronger password"
      );
    });

    it("should return multiple errors for very weak password", () => {
      const result = passwordService.validatePasswordStrength("weak");

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain(
        "Password must be at least 8 characters long"
      );
    });

    it("should accept password with special characters", () => {
      const result = passwordService.validatePasswordStrength("Strong@Pass123");

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("generatePassword", () => {
    it("should generate password of specified length", () => {
      const password = passwordService.generatePassword(16);

      expect(password).toBeTruthy();
      expect(password.length).toBeGreaterThanOrEqual(16);
    });

    it("should generate password with minimum 12 characters", () => {
      const password = passwordService.generatePassword(8);

      expect(password.length).toBeGreaterThanOrEqual(12);
    });

    it("should generate different passwords each time", () => {
      const password1 = passwordService.generatePassword(16);
      const password2 = passwordService.generatePassword(16);

      expect(password1).not.toBe(password2);
    });

    it("should generate password that passes validation", () => {
      const password = passwordService.generatePassword(16);
      const result = passwordService.validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
    });

    it("should include uppercase letters", () => {
      const password = passwordService.generatePassword(16);

      expect(password).toMatch(/[A-Z]/);
    });

    it("should include lowercase letters", () => {
      const password = passwordService.generatePassword(16);

      expect(password).toMatch(/[a-z]/);
    });

    it("should include numbers", () => {
      const password = passwordService.generatePassword(16);

      expect(password).toMatch(/\d/);
    });

    it("should include special characters", () => {
      const password = passwordService.generatePassword(16);

      expect(password).toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/);
    });
  });

  describe("edge cases", () => {
    it("should handle empty password in validation", () => {
      const result = passwordService.validatePasswordStrength("");

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle very long password", async () => {
      const longPassword = "A".repeat(100) + "a1";
      const hash = await passwordService.hashPassword(longPassword);

      expect(hash).toBeTruthy();

      const isMatch = await passwordService.comparePassword(longPassword, hash);
      expect(isMatch).toBe(true);
    });

    it("should handle unicode characters in password", async () => {
      const password = "Test🔒Pass123";
      const hash = await passwordService.hashPassword(password);

      const isMatch = await passwordService.comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });
  });
});
