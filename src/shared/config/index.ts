import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Determine environment
const env = process.env.NODE_ENV || "development";

// Load environment-specific file
const envPath = path.resolve(process.cwd(), `.env.${env}`);
const envLocalPath = path.resolve(process.cwd(), `.env.${env}.local`);
const envDefaultPath = path.resolve(process.cwd(), `.env`);

// Load in priority order: .env.{env}.local > .env.{env} > .env
if (fs.existsSync(envLocalPath)) {
  console.log(`📝 Loading environment from: .env.${env}.local`);
  dotenv.config({path: envLocalPath});
} else if (fs.existsSync(envPath)) {
  console.log(`📝 Loading environment from: .env.${env}`);
  dotenv.config({path: envPath});
} else if (fs.existsSync(envDefaultPath)) {
  console.log(`📝 Loading environment from: .env (fallback)`);
  dotenv.config({path: envDefaultPath});
} else {
  console.warn(
    `⚠️  No environment file found. Using process environment variables only.`
  );
}

// Environment validation will be performed after config is created
// See src/shared/utils/validateEnv.ts

interface Config {
  app: {
    name: string;
    version: string;
    env: string;
    port: number;
    apiPrefix: string;
    frontendUrl: string;
  };
  database: {
    uri: string;
    options: {
      maxPoolSize: number;
      minPoolSize: number;
      socketTimeoutMS: number;
      serverSelectionTimeoutMS: number;
      heartbeatFrequencyMS: number;
    };
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
    algorithm: string;
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
  };
  upload: {
    maxFileSize: number;
    allowedTypes: string[];
  };
  email: {
    service: string;
    host?: string;
    port?: number;
    secure?: boolean;
    user: string;
    pass: string;
    from: string;
  };
  redis: {
    url: string;
    maxRetriesPerRequest: number;
    enableReadyCheck: boolean;
  };
  session: {
    secret: string;
    cookieName: string;
    ttl: number;
    prefix: string;
    secure: boolean;
  };
  logging: {
    level: string;
    filePath: string;
    enableConsole: boolean;
    enableFile: boolean;
  };
  security: {
    bcryptRounds: number;
    enableCSRF: boolean;
    enableRateLimiting: boolean;
    enableHelmet: boolean;
  };
  oauth: {
    google: {
      clientId: string;
      clientSecret: string;
      callbackURL: string;
      enabled: boolean;
    };
    github: {
      clientId: string;
      clientSecret: string;
      callbackURL: string;
      enabled: boolean;
    };
    facebook: {
      clientId: string;
      clientSecret: string;
      callbackURL: string;
      enabled: boolean;
    };
  };
  mfa: {
    issuer: string;
    enabled: boolean;
  };
  aws?: {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    s3Bucket?: string;
  };
  features: {
    enableSocketIO: boolean;
    enableSwagger: boolean;
    enableMetrics: boolean;
    enableHealthCheck: boolean;
  };
}

const config: Config = {
  app: {
    name: process.env.APP_NAME || "Sports Companion API",
    version: process.env.APP_VERSION || "1.0.0",
    env: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "3000", 10),
    apiPrefix: process.env.API_PREFIX || "/api/v1",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  },
  database: {
    uri:
      process.env.MONGODB_URI || "mongodb://localhost:27017/sportification_dev",
    options: {
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || "10", 10),
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || "2", 10),
      socketTimeoutMS: parseInt(
        process.env.MONGODB_SOCKET_TIMEOUT || "45000",
        10
      ),
      serverSelectionTimeoutMS: parseInt(
        process.env.MONGODB_SERVER_SELECTION_TIMEOUT || "5000",
        10
      ),
      heartbeatFrequencyMS: parseInt(
        process.env.MONGODB_HEARTBEAT_FREQUENCY || "10000",
        10
      ),
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || "default-secret-change-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      "default-refresh-secret-change-in-production",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
    algorithm: process.env.JWT_ALGORITHM || "HS256",
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
    credentials: process.env.CORS_CREDENTIALS === "true",
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
    skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL === "true",
    skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED === "true",
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10), // 10MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(",") || [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/mpeg",
    ],
  },
  email: {
    service: process.env.EMAIL_SERVICE || "gmail",
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT
      ? parseInt(process.env.EMAIL_PORT, 10)
      : undefined,
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
    from: process.env.EMAIL_FROM || "noreply@sportification.com",
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || "3", 10),
    enableReadyCheck: process.env.REDIS_ENABLE_READY_CHECK !== "false",
  },
  session: {
    secret:
      process.env.SESSION_SECRET ||
      process.env.JWT_SECRET ||
      "default-session-secret",
    cookieName: process.env.SESSION_COOKIE_NAME || "sportification.sid",
    ttl: parseInt(process.env.SESSION_TTL || "3600", 10),
    prefix: process.env.SESSION_REDIS_PREFIX || "session:",
    secure:
      process.env.SESSION_COOKIE_SECURE === "true" ||
      process.env.NODE_ENV === "production",
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
    filePath: process.env.LOG_FILE_PATH || "logs/app.log",
    enableConsole: process.env.LOG_ENABLE_CONSOLE !== "false",
    enableFile: process.env.LOG_ENABLE_FILE !== "false",
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12", 10),
    enableCSRF: process.env.SECURITY_ENABLE_CSRF === "true",
    enableRateLimiting: process.env.SECURITY_ENABLE_RATE_LIMITING !== "false",
    enableHelmet: process.env.SECURITY_ENABLE_HELMET !== "false",
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL || "/api/v1/auth/google/callback",
      enabled:
        !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      callbackURL:
        process.env.GITHUB_CALLBACK_URL || "/api/v1/auth/github/callback",
      enabled:
        !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET,
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
      callbackURL:
        process.env.FACEBOOK_CALLBACK_URL || "/api/v1/auth/facebook/callback",
      enabled:
        !!process.env.FACEBOOK_CLIENT_ID &&
        !!process.env.FACEBOOK_CLIENT_SECRET,
    },
  },
  mfa: {
    issuer: process.env.MFA_ISSUER || "Sportification",
    enabled: process.env.MFA_ENABLED !== "false",
  },
  aws: process.env.AWS_REGION
    ? {
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        s3Bucket: process.env.AWS_S3_BUCKET,
      }
    : undefined,
  features: {
    enableSocketIO: process.env.FEATURE_SOCKET_IO !== "false",
    enableSwagger: process.env.FEATURE_SWAGGER !== "false",
    enableMetrics: process.env.FEATURE_METRICS === "true",
    enableHealthCheck: process.env.FEATURE_HEALTH_CHECK !== "false",
  },
};

export default config;
