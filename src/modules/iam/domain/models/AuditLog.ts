import { Schema, model, Model } from 'mongoose';
import { Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  sessionId?: string;
  apiKeyId?: Types.ObjectId;
}

export interface IAuditLogStatics {
  logAction(params: {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress: string;
    userAgent?: string;
    status?: 'success' | 'failure' | 'warning';
    severity?: 'low' | 'medium' | 'high' | 'critical';
    sessionId?: string;
    apiKeyId?: string;
  }): Promise<IAuditLog>;

  getSecurityEvents(params: {
    userId?: string;
    severity?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    skip?: number;
  }): Promise<IAuditLog[]>;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
      enum: [
        // Authentication actions
        'login',
        'logout',
        'login_failed',
        'account_locked',
        'password_reset_requested',
        'password_reset_completed',
        'password_changed',
        'email_verified',

        // MFA actions
        'mfa_enabled',
        'mfa_disabled',
        'mfa_login_success',
        'mfa_login_failed',
        'mfa_backup_code_used',

        // OAuth actions
        'oauth_login',
        'oauth_account_linked',
        'oauth_account_unlinked',

        // API key actions
        'api_key_created',
        'api_key_used',
        'api_key_regenerated',
        'api_key_deleted',
        'api_key_rate_limited',
        'api_key_expired',

        // Security actions
        'security_settings_updated',
        'ip_restriction_violation',
        'suspicious_activity',
        'data_export_requested',
        'account_deleted',

        // Admin actions
        'user_impersonated',
        'admin_action',
        'permission_granted',
        'permission_revoked',
      ],
    },
    resource: {
      type: String,
      required: true,
      index: true,
      enum: [
        'user',
        'auth',
        'mfa',
        'oauth',
        'api_key',
        'security',
        'admin',
        'match',
        'tournament',
        'venue',
        'notification',
        'chat',
      ],
    },
    resourceId: {
      type: String,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: ['success', 'failure', 'warning'],
      default: 'success',
      index: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      // Note: No inline index here - TTL index is defined separately below
    },
    sessionId: {
      type: String,
      index: true,
    },
    apiKeyId: {
      type: Schema.Types.ObjectId,
      ref: 'ApiKey',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Indexes for performance
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });
auditLogSchema.index({ ipAddress: 1, timestamp: -1 });

// TTL index to automatically delete old logs (keep for 2 years)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 });

// Static method to log actions
auditLogSchema.statics.logAction = async function (params: {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress: string;
  userAgent?: string;
  status?: 'success' | 'failure' | 'warning';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  sessionId?: string;
  apiKeyId?: string;
}): Promise<IAuditLog> {
  try {
    const auditLog = new this({
      userId: params.userId ? Types.ObjectId.createFromHexString(params.userId) : undefined,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details || {},
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      status: params.status || 'success',
      severity: params.severity || 'low',
      sessionId: params.sessionId,
      apiKeyId: params.apiKeyId ? Types.ObjectId.createFromHexString(params.apiKeyId) : undefined,
      timestamp: new Date(),
    });

    await auditLog.save();
    return auditLog;
  } catch (error) {
    // Log to console if audit logging fails (don't throw to avoid breaking main flow)
    console.error('Failed to create audit log:', error);
    throw error;
  }
};

// Static method to get security events
auditLogSchema.statics.getSecurityEvents = function (params: {
  userId?: string;
  severity?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
}) {
  const filter: any = {};

  if (params.userId) {
    filter.userId = Types.ObjectId.createFromHexString(params.userId);
  }

  if (params.severity) {
    filter.severity = params.severity;
  }

  if (params.action) {
    filter.action = params.action;
  }

  if (params.startDate || params.endDate) {
    filter.timestamp = {};
    if (params.startDate) filter.timestamp.$gte = params.startDate;
    if (params.endDate) filter.timestamp.$lte = params.endDate;
  }

  return this.find(filter)
    .populate('userId', 'email profile')
    .populate('apiKeyId', 'name')
    .sort({ timestamp: -1 })
    .skip(params.skip || 0)
    .limit(params.limit || 100);
};

export const AuditLog = model<IAuditLog, Model<IAuditLog> & IAuditLogStatics>(
  'AuditLog',
  auditLogSchema
);
