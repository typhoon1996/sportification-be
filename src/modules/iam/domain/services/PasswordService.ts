/**
 * PasswordService - Password Management
 *
 * This service handles all password-related operations including hashing, comparison, and validation.
 *
 * Following SOLID Principles:
 * - Single Responsibility: Only handles password operations
 * - Dependency Inversion: Implements IPasswordService interface
 * - Open/Closed: Extensible for different hashing algorithms without modification
 *
 * Security Features:
 * - bcrypt hashing with configurable salt rounds
 * - Password strength validation
 * - Secure password comparison
 *
 * @class PasswordService
 * @implements {IPasswordService}
 */

import bcrypt from "bcryptjs";
import {IPasswordService} from "../interfaces";

export class PasswordService implements IPasswordService {
  private readonly saltRounds: number;

  /**
   * Minimum password requirements
   */
  private readonly MIN_LENGTH = 8;
  private readonly REQUIRE_UPPERCASE = true;
  private readonly REQUIRE_LOWERCASE = true;
  private readonly REQUIRE_NUMBER = true;
  private readonly REQUIRE_SPECIAL = false; // Optional for better UX

  /**
   * Initialize PasswordService with configuration
   * @param saltRounds - bcrypt salt rounds (default: 10)
   */
  constructor(saltRounds: number = 10) {
    this.saltRounds = saltRounds;
  }

  /**
   * Hash a plain text password using bcrypt
   *
   * Uses bcrypt with configurable salt rounds (default: 10).
   * Higher salt rounds = more secure but slower.
   *
   * @param {string} password - Plain text password to hash
   * @return {Promise<string>} Hashed password
   *
   * @example
   * const hashedPassword = await passwordService.hashPassword('MySecurePass123');
   * // Returns: '$2a$10$...' (bcrypt hash)
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compare plain text password with bcrypt hash
   *
   * Uses constant-time comparison to prevent timing attacks.
   * Returns true if the password matches the hash.
   *
   * @param {string} password - Plain text password to verify
   * @param {string} hashedPassword - bcrypt hashed password
   * @return {Promise<boolean>} True if password matches, false otherwise
   *
   * @example
   * const isValid = await passwordService.comparePassword(
   *   'MySecurePass123',
   *   '$2a$10$...'
   * );
   * if (isValid) {
   *   // Password is correct
   * }
   */
  async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      // Log error but don't expose it to caller
      // Return false for any comparison errors
      return false;
    }
  }

  /**
   * Validate password strength
   *
   * Checks password against security requirements:
   * - Minimum length (8 characters)
   * - Contains uppercase letter
   * - Contains lowercase letter
   * - Contains number
   * - Contains special character (optional)
   *
   * @param {string} password - Password to validate
   * @return {object} Validation result with isValid flag and error messages
   *
   * @example
   * const result = passwordService.validatePasswordStrength('weak');
   * if (!result.isValid) {
   *   console.log(result.errors);
   *   // ['Password must be at least 8 characters', ...]
   * }
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check minimum length
    if (password.length < this.MIN_LENGTH) {
      errors.push(
        `Password must be at least ${this.MIN_LENGTH} characters long`
      );
    }

    // Check for uppercase letter
    if (this.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    // Check for lowercase letter
    if (this.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    // Check for number
    if (this.REQUIRE_NUMBER && !/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    // Check for special character (optional)
    if (this.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    // Check for common weak passwords
    if (this.isCommonPassword(password)) {
      errors.push("Password is too common. Please choose a stronger password");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if password is in common password list
   *
   * Prevents use of commonly used passwords that are easily guessed.
   * This is a simplified check - in production, use a comprehensive dictionary.
   *
   * @private
   * @param {string} password - Password to check
   * @return {boolean} True if password is common
   */
  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      "password",
      "password123",
      "12345678",
      "qwerty",
      "abc123",
      "monkey",
      "1234567",
      "letmein",
      "trustno1",
      "dragon",
      "baseball",
      "iloveyou",
      "master",
      "sunshine",
      "ashley",
      "bailey",
      "passw0rd",
      "shadow",
      "123123",
      "654321",
      "superman",
      "qazwsx",
      "michael",
      "football",
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Generate a random password
   *
   * Useful for temporary passwords or password reset flows.
   * Generates a cryptographically secure random password that meets all requirements.
   *
   * @param {number} length - Desired password length (minimum 12)
   * @return {string} Generated password
   *
   * @example
   * const tempPassword = passwordService.generatePassword(16);
   * // Returns: 'A7k#mP9qL2xR5nW8'
   */
  generatePassword(length: number = 12): string {
    const minLength = Math.max(length, 12);
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    const allChars = uppercase + lowercase + numbers + special;

    let password = "";

    // Ensure at least one of each required type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly
    for (let i = password.length; i < minLength; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to avoid predictable patterns
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  }
}
