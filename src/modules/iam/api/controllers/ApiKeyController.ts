import {Response} from "express";
import logger from "../../../../shared/infrastructure/logging";
import {AuthRequest} from "../../../../shared/middleware/auth";
import {
  ValidationError,
  NotFoundError,
  sendSuccess,
  sendCreated,
  asyncHandler,
} from "../../../../shared/middleware/errorHandler";
import {ApiKey} from "../../domain/models/ApiKey";

/**
 * API Key Controller - API Key Management
 *
 * Handles programmatic API access through key-based authentication.
 * Provides endpoints for generating, managing, and revoking API keys with
 * granular permissions, IP whitelisting, and rate limiting capabilities.
 *
 * Key Features:
 * - Secure key generation with cryptographic hashing
 * - Permission-based access control (read/write per resource)
 * - IP whitelisting for enhanced security
 * - Per-key rate limiting configuration
 * - Key lifecycle management (create, update, regenerate, delete)
 * - Usage tracking and statistics
 * - Expiration date management
 *
 * Security:
 * - Keys are only shown once during creation/regeneration
 * - Stored as bcrypt hashes in database
 * - All endpoints require user authentication
 * - Keys are scoped to the creating user
 *
 * @class ApiKeyController
 */
export class ApiKeyController {
  /**
   * Create a new API key
   *
   * Generates a cryptographically secure API key with specified permissions and restrictions.
   * The key is hashed using bcrypt before storage and is only returned once during creation.
   * Users can configure permissions, IP whitelist, rate limits, and expiration.
   *
   * Available Permissions:
   * - read:users, write:users
   * - read:matches, write:matches
   * - read:tournaments, write:tournaments
   * - read:venues, write:venues
   * - admin:all (full access)
   *
   * @async
   * @param {AuthRequest} req - Express request with user authentication
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 201 Created with API key details and raw key
   *
   * @throws {ValidationError} If name is missing or permissions/IPs are invalid
   *
   * Request Body:
   * @property {string} name - Human-readable name for the API key
   * @property {string[]} permissions - Array of permission strings
   * @property {string[]} allowedIPs - Array of IP addresses (optional)
   * @property {number} expiresInDays - Days until key expires (optional)
   * @property {number} maxRequests - Max requests per window (default: 1000, max: 10000)
   * @property {number} windowMs - Rate limit window in ms (default: 1 hour, max: 24 hours)
   *
   * @example
   * POST /api/v1/iam/api-keys
   * Body: {
   *   name: "Mobile App API Key",
   *   permissions: ["read:matches", "write:matches", "read:users"],
   *   allowedIPs: ["192.168.1.100"],
   *   expiresInDays: 365,
   *   maxRequests: 5000,
   *   windowMs: 3600000
   * }
   *
   * Response: {
   *   success: true,
   *   data: {
   *     apiKey: { id, name, permissions, rateLimit, expiresAt, ... },
   *     key: "sk_live_abc123..." // Only shown once!
   *   },
   *   message: "API key created successfully..."
   * }
   */
  static createApiKey = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const {
        name,
        permissions = [],
        allowedIPs = [],
        expiresInDays,
        maxRequests = 1000,
        windowMs = 3600000, // 1 hour
      } = req.body;

      if (!name) {
        throw new ValidationError("API key name is required");
      }

      // Validate permissions
      const validPermissions = [
        "read:users",
        "write:users",
        "read:matches",
        "write:matches",
        "read:tournaments",
        "write:tournaments",
        "read:venues",
        "write:venues",
        "admin:all",
      ];

      const invalidPermissions = permissions.filter(
        (p: string) => !validPermissions.includes(p)
      );
      if (invalidPermissions.length > 0) {
        throw new ValidationError(
          `Invalid permissions: ${invalidPermissions.join(", ")}`
        );
      }

      // Validate IPs if provided
      if (allowedIPs.length > 0) {
        const ipRegex =
          /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const invalidIPs = allowedIPs.filter((ip: string) => !ipRegex.test(ip));

        if (invalidIPs.length > 0) {
          throw new ValidationError(
            `Invalid IP addresses: ${invalidIPs.join(", ")}`
          );
        }
      }

      // Generate API key
      const {key, hash} = ApiKey.generateApiKey();

      // Calculate expiration date
      let expiresAt: Date | undefined;
      if (expiresInDays && expiresInDays > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      }

      // Create API key document
      const apiKey = new ApiKey({
        name,
        keyHash: hash,
        userId: req.user._id,
        permissions,
        allowedIPs,
        expiresAt,
        rateLimit: {
          maxRequests: Math.min(Math.max(maxRequests, 1), 10000),
          windowMs: Math.min(Math.max(windowMs, 60000), 86400000),
        },
      });

      await apiKey.save();

      logger.info(`API key created: ${name}`, {
        userId: req.user._id,
        keyId: apiKey._id,
        permissions,
      });

      sendCreated(
        res,
        {
          apiKey: {
            id: apiKey._id,
            name: apiKey.name,
            permissions: apiKey.permissions,
            allowedIPs: apiKey.allowedIPs,
            rateLimit: apiKey.rateLimit,
            expiresAt: apiKey.expiresAt,
            createdAt: apiKey.createdAt,
          },
          key, // Only returned once during creation
        },
        "API key created successfully. Save this key securely - it cannot be retrieved again."
      );
    }
  );

  /**
   * List user's API keys
   *
   * Retrieves a paginated list of all API keys belonging to the authenticated user.
   * Keys are returned with all metadata except the actual key value (key hash is excluded).
   * Sorted by creation date (newest first).
   *
   * @async
   * @param {AuthRequest} req - Express request with user authentication
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with paginated list of API keys
   *
   * Query Parameters:
   * @property {number} page - Page number (default: 1)
   * @property {number} limit - Items per page (default: 10)
   *
   * @example
   * GET /api/v1/iam/api-keys?page=1&limit=10
   *
   * Response: {
   *   success: true,
   *   data: {
   *     apiKeys: [...],
   *     pagination: { page: 1, limit: 10, total: 3, pages: 1 }
   *   }
   * }
   */
  static listApiKeys = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {page = 1, limit = 10} = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [apiKeys, total] = await Promise.all([
      ApiKey.find({userId: req.user._id})
        .select("-keyHash")
        .sort({createdAt: -1})
        .skip(skip)
        .limit(Number(limit)),
      ApiKey.countDocuments({userId: req.user._id}),
    ]);

    sendSuccess(
      res,
      {
        apiKeys,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
      "API keys retrieved successfully"
    );
  });

  /**
   * Get specific API key details
   *
   * Retrieves detailed information about a single API key by ID.
   * Only returns keys belonging to the authenticated user.
   *
   * @async
   * @param {AuthRequest} req - Express request with user authentication
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with API key details
   *
   * @throws {NotFoundError} If API key doesn't exist or doesn't belong to user
   *
   * @example
   * GET /api/v1/iam/api-keys/:keyId
   */
  static getApiKey = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {keyId} = req.params;

    const apiKey = await ApiKey.findOne({
      _id: keyId,
      userId: req.user._id,
    }).select("-keyHash");

    if (!apiKey) {
      throw new NotFoundError("API key");
    }

    sendSuccess(res, {apiKey}, "API key retrieved successfully");
  });

  /**
   * Update API key settings
   *
   * Modifies an existing API key's configuration including name, permissions,
   * IP whitelist, active status, and rate limit settings. Cannot change the
   * actual key value - use regenerateApiKey for that.
   *
   * @async
   * @param {AuthRequest} req - Express request with user authentication
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with updated API key details
   *
   * @throws {NotFoundError} If API key doesn't exist or doesn't belong to user
   * @throws {ValidationError} If permissions or IP addresses are invalid
   *
   * Request Body (all fields optional):
   * @property {string} name - New name for the API key
   * @property {string[]} permissions - Updated permissions array
   * @property {string[]} allowedIPs - Updated IP whitelist
   * @property {boolean} isActive - Enable/disable the key
   * @property {number} maxRequests - New rate limit max (1-10000)
   * @property {number} windowMs - New rate limit window (1 min - 24 hours)
   *
   * @example
   * PATCH /api/v1/iam/api-keys/:keyId
   * Body: {
   *   isActive: false,
   *   maxRequests: 2000
   * }
   */
  static updateApiKey = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const {keyId} = req.params;
      const {name, permissions, allowedIPs, isActive, maxRequests, windowMs} =
        req.body;

      const apiKey = await ApiKey.findOne({
        _id: keyId,
        userId: req.user._id,
      });

      if (!apiKey) {
        throw new NotFoundError("API key");
      }

      // Update fields if provided
      if (name !== undefined) {
        apiKey.name = name;
      }

      if (permissions !== undefined) {
        const validPermissions = [
          "read:users",
          "write:users",
          "read:matches",
          "write:matches",
          "read:tournaments",
          "write:tournaments",
          "read:venues",
          "write:venues",
          "admin:all",
        ];

        const invalidPermissions = permissions.filter(
          (p: string) => !validPermissions.includes(p)
        );
        if (invalidPermissions.length > 0) {
          throw new ValidationError(
            `Invalid permissions: ${invalidPermissions.join(", ")}`
          );
        }

        apiKey.permissions = permissions;
      }

      if (allowedIPs !== undefined) {
        if (allowedIPs.length > 0) {
          const ipRegex =
            /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
          const invalidIPs = allowedIPs.filter(
            (ip: string) => !ipRegex.test(ip)
          );

          if (invalidIPs.length > 0) {
            throw new ValidationError(
              `Invalid IP addresses: ${invalidIPs.join(", ")}`
            );
          }
        }

        apiKey.allowedIPs = allowedIPs;
      }

      if (isActive !== undefined) {
        apiKey.isActive = isActive;
      }

      if (maxRequests !== undefined || windowMs !== undefined) {
        if (maxRequests !== undefined) {
          apiKey.rateLimit.maxRequests = Math.min(
            Math.max(maxRequests, 1),
            10000
          );
        }
        if (windowMs !== undefined) {
          apiKey.rateLimit.windowMs = Math.min(
            Math.max(windowMs, 60000),
            86400000
          );
        }
      }

      await apiKey.save();

      logger.info(`API key updated: ${apiKey.name}`, {
        userId: req.user._id,
        keyId: apiKey._id,
      });

      sendSuccess(
        res,
        {
          apiKey: {
            id: apiKey._id,
            name: apiKey.name,
            permissions: apiKey.permissions,
            allowedIPs: apiKey.allowedIPs,
            rateLimit: apiKey.rateLimit,
            isActive: apiKey.isActive,
            expiresAt: apiKey.expiresAt,
            lastUsedAt: apiKey.lastUsedAt,
            updatedAt: apiKey.updatedAt,
          },
        },
        "API key updated successfully"
      );
    }
  );

  /**
   * Delete (revoke) an API key
   *
   * Permanently deletes an API key, immediately revoking all access.
   * This action cannot be undone. All subsequent requests using this key will fail.
   *
   * @async
   * @param {AuthRequest} req - Express request with user authentication
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with success message
   *
   * @throws {NotFoundError} If API key doesn't exist or doesn't belong to user
   *
   * @example
   * DELETE /api/v1/iam/api-keys/:keyId
   */
  static deleteApiKey = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const {keyId} = req.params;

      const apiKey = await ApiKey.findOneAndDelete({
        _id: keyId,
        userId: req.user._id,
      });

      if (!apiKey) {
        throw new NotFoundError("API key");
      }

      logger.info(`API key deleted: ${apiKey.name}`, {
        userId: req.user._id,
        keyId: apiKey._id,
      });

      sendSuccess(res, {}, "API key deleted successfully");
    }
  );

  /**
   * Regenerate (rotate) an API key
   *
   * Generates a new key value while maintaining all other settings (permissions,
   * IP whitelist, rate limits, etc.). This is useful for key rotation security practices.
   * The old key is immediately invalidated and the new key is returned once.
   * Resets usage tracking statistics.
   *
   * @async
   * @param {AuthRequest} req - Express request with user authentication
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with new key value and metadata
   *
   * @throws {NotFoundError} If API key doesn't exist or doesn't belong to user
   *
   * @example
   * POST /api/v1/iam/api-keys/:keyId/regenerate
   *
   * Response: {
   *   success: true,
   *   data: {
   *     apiKey: { id, name, permissions, ... },
   *     key: "sk_live_xyz789..." // New key, only shown once!
   *   },
   *   message: "API key regenerated successfully..."
   * }
   */
  static regenerateApiKey = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const {keyId} = req.params;

      const apiKey = await ApiKey.findOne({
        _id: keyId,
        userId: req.user._id,
      });

      if (!apiKey) {
        throw new NotFoundError("API key");
      }

      // Generate new key
      const {key, hash} = ApiKey.generateApiKey();
      apiKey.keyHash = hash;
      apiKey.lastUsedAt = undefined; // Reset usage tracking

      await apiKey.save();

      logger.info(`API key regenerated: ${apiKey.name}`, {
        userId: req.user._id,
        keyId: apiKey._id,
      });

      sendSuccess(
        res,
        {
          apiKey: {
            id: apiKey._id,
            name: apiKey.name,
            permissions: apiKey.permissions,
            allowedIPs: apiKey.allowedIPs,
            rateLimit: apiKey.rateLimit,
            expiresAt: apiKey.expiresAt,
            updatedAt: apiKey.updatedAt,
          },
          key, // Only returned once during regeneration
        },
        "API key regenerated successfully. Save this key securely - it cannot be retrieved again."
      );
    }
  );

  /**
   * Get API key usage statistics
   *
   * Retrieves aggregated statistics about all API keys belonging to the user.
   * Includes counts of total, active, expired, and recently used keys.
   *
   * @async
   * @param {AuthRequest} req - Express request with user authentication
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with usage statistics
   *
   * Statistics Included:
   * @property {number} total - Total number of API keys
   * @property {number} active - Number of active (non-disabled) keys
   * @property {number} expired - Number of keys past expiration date
   * @property {number} recentlyUsed - Number of keys used in last 7 days
   *
   * @example
   * GET /api/v1/iam/api-keys/stats
   *
   * Response: {
   *   success: true,
   *   data: {
   *     stats: {
   *       total: 5,
   *       active: 4,
   *       expired: 1,
   *       recentlyUsed: 3
   *     }
   *   }
   * }
   */
  static getApiKeyStats = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const stats = await ApiKey.aggregate([
        {$match: {userId: req.user._id}},
        {
          $group: {
            _id: null,
            total: {$sum: 1},
            active: {$sum: {$cond: ["$isActive", 1, 0]}},
            expired: {
              $sum: {
                $cond: [
                  {$and: ["$expiresAt", {$lt: ["$expiresAt", new Date()]}]},
                  1,
                  0,
                ],
              },
            },
            recentlyUsed: {
              $sum: {
                $cond: [
                  {
                    $gte: [
                      "$lastUsedAt",
                      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    ],
                  }, // Last 7 days
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

      const result = stats[0] || {
        total: 0,
        active: 0,
        expired: 0,
        recentlyUsed: 0,
      };

      sendSuccess(
        res,
        {stats: result},
        "API key statistics retrieved successfully"
      );
    }
  );
}
