import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
import config from "../../config";

/**
 * Multi-Factor Authentication (MFA) Utility class
 * Provides TOTP-based two-factor authentication functionality
 */
export class MFAUtil {
  /**
   * Generate a secret key for Time-based One-Time Password (TOTP)
   *
   * @param email - The user's email address to associate with the secret
   * @return Object containing the base32 secret and OTP auth URL for QR code
   * @example
   * const { secret, qrCodeUrl } = MFAUtil.generateSecret('user@example.com');
   * // Store secret in database and show QR code to user
   */
  static generateSecret(email: string): {secret: string; qrCodeUrl: string} {
    const secret = speakeasy.generateSecret({
      issuer: config.mfa.issuer,
      name: email,
      length: 32,
    });

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url!,
    };
  }

  /**
   * Generate QR code image as a data URL for easy display
   *
   * @param otpauthUrl - The OTP auth URL from generateSecret()
   * @return Data URL string containing the QR code image
   * @throws {Error} If QR code generation fails
   * @example
   * const qrCodeImage = await MFAUtil.generateQRCode(qrCodeUrl);
   * // Send qrCodeImage to client to display
   */
  static async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataURL;
    } catch (error) {
      throw new Error("Failed to generate QR code");
    }
  }

  /**
   * Verify a TOTP token against the secret
   *
   * @param secret - The user's TOTP secret (base32 encoded)
   * @param token - The 6-digit token from user's authenticator app
   * @return True if token is valid, false otherwise
   * @example
   * const isValid = MFAUtil.verifyToken(user.mfaSecret, '123456');
   * if (isValid) {
   *   // Allow login
   * }
   */
  static verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2, // Allow some time drift (±2 intervals)
    });
  }

  /**
   * Generate backup codes for account recovery
   * These codes can be used when the user loses access to their authenticator app
   *
   * @param count - Number of backup codes to generate (default: 8)
   * @return Array of backup codes (each 10 characters)
   * @example
   * const backupCodes = MFAUtil.generateBackupCodes(10);
   * // Store hashed versions in database, show plain codes to user once
   */
  static generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
    }
    return codes;
  }

  /**
   * Verify backup code
   */
  static verifyBackupCode(
    userBackupCodes: string[],
    providedCode: string
  ): boolean {
    const normalizedCode = providedCode.toUpperCase().replace(/\s+/g, "");
    return userBackupCodes.includes(normalizedCode);
  }

  /**
   * Remove used backup code
   */
  static removeBackupCode(
    userBackupCodes: string[],
    usedCode: string
  ): string[] {
    const normalizedCode = usedCode.toUpperCase().replace(/\s+/g, "");
    return userBackupCodes.filter(code => code !== normalizedCode);
  }
}

export class SecurityUtil {
  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Hash token for storage
   */
  static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Generate device fingerprint
   */
  static generateDeviceFingerprint(userAgent: string, ip: string): string {
    const data = `${userAgent}:${ip}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      feedback.push("Password must be at least 8 characters long");
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    // Common patterns check
    if (/(.)\1{2,}/.test(password)) {
      feedback.push("Avoid repeating characters");
      score -= 1;
    }

    if (/123|abc|qwe/i.test(password)) {
      feedback.push("Avoid common sequences");
      score -= 1;
    }

    // Common passwords check (simplified)
    const commonPasswords = [
      "password",
      "123456",
      "qwerty",
      "abc123",
      "password123",
      "admin",
      "letmein",
      "welcome",
      "monkey",
      "dragon",
    ];
    if (
      commonPasswords.some(common => password.toLowerCase().includes(common))
    ) {
      feedback.push("Avoid common passwords");
      score -= 2;
    }

    // Score interpretation
    const isValid = score >= 4 && feedback.length === 0;

    if (!isValid && feedback.length === 0) {
      if (score < 2) {
        feedback.push("Password is very weak. Add more character variety.");
      } else if (score < 4) {
        feedback.push(
          "Password is weak. Consider adding uppercase, numbers, and symbols."
        );
      }
    }

    return {
      isValid,
      score: Math.max(0, Math.min(5, score)),
      feedback,
    };
  }

  /**
   * Check if IP is in allowed list
   */
  static isIPAllowed(ip: string, allowedIPs: string[]): boolean {
    if (allowedIPs.length === 0) return true;
    return allowedIPs.includes(ip);
  }

  /**
   * Generate email verification token
   */
  static generateEmailVerificationToken(): {
    token: string;
    hashedToken: string;
    expires: Date;
  } {
    const token = this.generateSecureToken();
    const hashedToken = this.hashToken(token);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return {token, hashedToken, expires};
  }

  /**
   * Generate password reset token
   */
  static generatePasswordResetToken(): {
    token: string;
    hashedToken: string;
    expires: Date;
  } {
    const token = this.generateSecureToken();
    const hashedToken = this.hashToken(token);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    return {token, hashedToken, expires};
  }
}
