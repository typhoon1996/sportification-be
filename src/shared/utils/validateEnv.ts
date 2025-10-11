/**
 * Environment Variable Validation Utility
 *
 * Validates required environment variables and provides helpful error messages
 * when configuration is missing or invalid.
 */

import logger from './logger';

interface ValidationRule {
  key: string;
  required: boolean;
  type?: 'string' | 'number' | 'boolean' | 'url' | 'email';
  pattern?: RegExp;
  oneOf?: string[];
  minLength?: number;
  min?: number;
  max?: number;
  description?: string;
}

const validationRules: ValidationRule[] = [
  // Application
  {
    key: 'NODE_ENV',
    required: true,
    oneOf: ['development', 'test', 'production'],
    description: 'Application environment',
  },
  {
    key: 'PORT',
    required: false,
    type: 'number',
    min: 1,
    max: 65535,
    description: 'Application port',
  },

  // Database
  { key: 'MONGODB_URI', required: true, type: 'url', description: 'MongoDB connection string' },

  // JWT
  {
    key: 'JWT_SECRET',
    required: true,
    type: 'string',
    minLength: 32,
    description: 'JWT signing secret (min 32 chars)',
  },
  {
    key: 'JWT_REFRESH_SECRET',
    required: true,
    type: 'string',
    minLength: 32,
    description: 'JWT refresh token secret (min 32 chars)',
  },
  {
    key: 'JWT_EXPIRES_IN',
    required: false,
    type: 'string',
    description: 'JWT access token expiration (e.g., 7d, 24h)',
  },
  {
    key: 'JWT_REFRESH_EXPIRES_IN',
    required: false,
    type: 'string',
    description: 'JWT refresh token expiration (e.g., 30d)',
  },

  // Session
  {
    key: 'SESSION_SECRET',
    required: false,
    type: 'string',
    minLength: 32,
    description: 'Session signing secret (min 32 chars)',
  },

  // Redis (optional but recommended for production)
  { key: 'REDIS_URL', required: false, type: 'url', description: 'Redis connection URL' },

  // CORS
  {
    key: 'CORS_ORIGIN',
    required: false,
    type: 'string',
    description: 'Allowed CORS origins (comma-separated)',
  },

  // Email (optional)
  { key: 'EMAIL_USER', required: false, type: 'string', description: 'Email service username' },
  { key: 'EMAIL_PASS', required: false, type: 'string', description: 'Email service password' },
  { key: 'EMAIL_FROM', required: false, type: 'email', description: 'Default from email address' },

  // OAuth (optional)
  {
    key: 'GOOGLE_CLIENT_ID',
    required: false,
    type: 'string',
    description: 'Google OAuth client ID',
  },
  {
    key: 'GOOGLE_CLIENT_SECRET',
    required: false,
    type: 'string',
    description: 'Google OAuth client secret',
  },
  {
    key: 'GITHUB_CLIENT_ID',
    required: false,
    type: 'string',
    description: 'GitHub OAuth client ID',
  },
  {
    key: 'GITHUB_CLIENT_SECRET',
    required: false,
    type: 'string',
    description: 'GitHub OAuth client secret',
  },
  {
    key: 'FACEBOOK_CLIENT_ID',
    required: false,
    type: 'string',
    description: 'Facebook OAuth client ID',
  },
  {
    key: 'FACEBOOK_CLIENT_SECRET',
    required: false,
    type: 'string',
    description: 'Facebook OAuth client secret',
  },

  // Security
  {
    key: 'BCRYPT_ROUNDS',
    required: false,
    type: 'number',
    min: 10,
    max: 15,
    description: 'Bcrypt hashing rounds (10-15)',
  },
];

interface ValidationError {
  key: string;
  error: string;
  description?: string;
}

export function validateEnvironment(): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const env = process.env.NODE_ENV || 'development';

  // Skip validation in test environment
  if (env === 'test') {
    return { valid: true, errors: [] };
  }

  for (const rule of validationRules) {
    const value = process.env[rule.key];

    // Check if required variable is missing
    if (rule.required && !value) {
      errors.push({
        key: rule.key,
        error: 'Required variable is missing',
        description: rule.description,
      });
      continue;
    }

    // Skip validation if value is not provided and not required
    if (!value) {
      continue;
    }

    // Type validation
    if (rule.type === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        errors.push({
          key: rule.key,
          error: `Must be a valid number, got: ${value}`,
          description: rule.description,
        });
        continue;
      }
      if (rule.min !== undefined && numValue < rule.min) {
        errors.push({
          key: rule.key,
          error: `Must be >= ${rule.min}, got: ${numValue}`,
          description: rule.description,
        });
      }
      if (rule.max !== undefined && numValue > rule.max) {
        errors.push({
          key: rule.key,
          error: `Must be <= ${rule.max}, got: ${numValue}`,
          description: rule.description,
        });
      }
    }

    if (rule.type === 'boolean') {
      if (value !== 'true' && value !== 'false') {
        errors.push({
          key: rule.key,
          error: `Must be 'true' or 'false', got: ${value}`,
          description: rule.description,
        });
      }
    }

    if (rule.type === 'url') {
      try {
        new URL(value);
      } catch {
        errors.push({
          key: rule.key,
          error: `Must be a valid URL, got: ${value}`,
          description: rule.description,
        });
      }
    }

    if (rule.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push({
          key: rule.key,
          error: `Must be a valid email, got: ${value}`,
          description: rule.description,
        });
      }
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push({
        key: rule.key,
        error: `Does not match required pattern: ${rule.pattern}`,
        description: rule.description,
      });
    }

    // Enum validation
    if (rule.oneOf && !rule.oneOf.includes(value)) {
      errors.push({
        key: rule.key,
        error: `Must be one of: ${rule.oneOf.join(', ')}. Got: ${value}`,
        description: rule.description,
      });
    }

    // Length validation
    if (rule.minLength && value.length < rule.minLength) {
      errors.push({
        key: rule.key,
        error: `Must be at least ${rule.minLength} characters long, got: ${value.length}`,
        description: rule.description,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function logValidationErrors(errors: ValidationError[]): void {
  logger.error('❌ Environment validation failed:');
  logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  errors.forEach((error, index) => {
    logger.error(`\n${index + 1}. ${error.key}`);
    logger.error(`   Error: ${error.error}`);
    if (error.description) {
      logger.error(`   Description: ${error.description}`);
    }
  });

  logger.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.error(`\n💡 Tip: Check your .env.${process.env.NODE_ENV || 'development'} file`);
  logger.error('   See .env.example for reference configuration\n');
}

export function validateAndExit(): void {
  const { valid, errors } = validateEnvironment();

  if (!valid) {
    logValidationErrors(errors);
    process.exit(1);
  }

  logger.info('✅ Environment validation passed');
}
