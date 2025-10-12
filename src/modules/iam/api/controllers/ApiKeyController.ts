import { Response } from 'express';
import { ApiKey } from '../../domain/models/ApiKey';
import {
  ValidationError,
  NotFoundError,
  sendSuccess,
  sendCreated,
  asyncHandler,
} from '../../../../shared/middleware/errorHandler';
import { AuthRequest } from '../../../../shared/middleware/auth';
import logger from '../../../../shared/infrastructure/logging';

export class ApiKeyController {
  // Create new API key
  static createApiKey = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      name,
      permissions = [],
      allowedIPs = [],
      expiresInDays,
      maxRequests = 1000,
      windowMs = 3600000, // 1 hour
    } = req.body;

    if (!name) {
      throw new ValidationError('API key name is required');
    }

    // Validate permissions
    const validPermissions = [
      'read:users',
      'write:users',
      'read:matches',
      'write:matches',
      'read:tournaments',
      'write:tournaments',
      'read:venues',
      'write:venues',
      'admin:all',
    ];

    const invalidPermissions = permissions.filter((p: string) => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      throw new ValidationError(`Invalid permissions: ${invalidPermissions.join(', ')}`);
    }

    // Validate IPs if provided
    if (allowedIPs.length > 0) {
      const ipRegex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const invalidIPs = allowedIPs.filter((ip: string) => !ipRegex.test(ip));

      if (invalidIPs.length > 0) {
        throw new ValidationError(`Invalid IP addresses: ${invalidIPs.join(', ')}`);
      }
    }

    // Generate API key
    const { key, hash } = ApiKey.generateApiKey();

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
      'API key created successfully. Save this key securely - it cannot be retrieved again.'
    );
  });

  // List user's API keys
  static listApiKeys = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [apiKeys, total] = await Promise.all([
      ApiKey.find({ userId: req.user._id })
        .select('-keyHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ApiKey.countDocuments({ userId: req.user._id }),
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
      'API keys retrieved successfully'
    );
  });

  // Get specific API key details
  static getApiKey = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { keyId } = req.params;

    const apiKey = await ApiKey.findOne({
      _id: keyId,
      userId: req.user._id,
    }).select('-keyHash');

    if (!apiKey) {
      throw new NotFoundError('API key');
    }

    sendSuccess(res, { apiKey }, 'API key retrieved successfully');
  });

  // Update API key
  static updateApiKey = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { keyId } = req.params;
    const { name, permissions, allowedIPs, isActive, maxRequests, windowMs } = req.body;

    const apiKey = await ApiKey.findOne({
      _id: keyId,
      userId: req.user._id,
    });

    if (!apiKey) {
      throw new NotFoundError('API key');
    }

    // Update fields if provided
    if (name !== undefined) {
      apiKey.name = name;
    }

    if (permissions !== undefined) {
      const validPermissions = [
        'read:users',
        'write:users',
        'read:matches',
        'write:matches',
        'read:tournaments',
        'write:tournaments',
        'read:venues',
        'write:venues',
        'admin:all',
      ];

      const invalidPermissions = permissions.filter((p: string) => !validPermissions.includes(p));
      if (invalidPermissions.length > 0) {
        throw new ValidationError(`Invalid permissions: ${invalidPermissions.join(', ')}`);
      }

      apiKey.permissions = permissions;
    }

    if (allowedIPs !== undefined) {
      if (allowedIPs.length > 0) {
        const ipRegex =
          /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const invalidIPs = allowedIPs.filter((ip: string) => !ipRegex.test(ip));

        if (invalidIPs.length > 0) {
          throw new ValidationError(`Invalid IP addresses: ${invalidIPs.join(', ')}`);
        }
      }

      apiKey.allowedIPs = allowedIPs;
    }

    if (isActive !== undefined) {
      apiKey.isActive = isActive;
    }

    if (maxRequests !== undefined || windowMs !== undefined) {
      if (maxRequests !== undefined) {
        apiKey.rateLimit.maxRequests = Math.min(Math.max(maxRequests, 1), 10000);
      }
      if (windowMs !== undefined) {
        apiKey.rateLimit.windowMs = Math.min(Math.max(windowMs, 60000), 86400000);
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
      'API key updated successfully'
    );
  });

  // Delete API key
  static deleteApiKey = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { keyId } = req.params;

    const apiKey = await ApiKey.findOneAndDelete({
      _id: keyId,
      userId: req.user._id,
    });

    if (!apiKey) {
      throw new NotFoundError('API key');
    }

    logger.info(`API key deleted: ${apiKey.name}`, {
      userId: req.user._id,
      keyId: apiKey._id,
    });

    sendSuccess(res, {}, 'API key deleted successfully');
  });

  // Regenerate API key
  static regenerateApiKey = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { keyId } = req.params;

    const apiKey = await ApiKey.findOne({
      _id: keyId,
      userId: req.user._id,
    });

    if (!apiKey) {
      throw new NotFoundError('API key');
    }

    // Generate new key
    const { key, hash } = ApiKey.generateApiKey();
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
      'API key regenerated successfully. Save this key securely - it cannot be retrieved again.'
    );
  });

  // Get API key usage statistics
  static getApiKeyStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await ApiKey.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          expired: {
            $sum: {
              $cond: [{ $and: ['$expiresAt', { $lt: ['$expiresAt', new Date()] }] }, 1, 0],
            },
          },
          recentlyUsed: {
            $sum: {
              $cond: [
                { $gte: ['$lastUsedAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] }, // Last 7 days
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

    sendSuccess(res, { stats: result }, 'API key statistics retrieved successfully');
  });
}
