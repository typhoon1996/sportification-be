import { Schema, model } from 'mongoose';
import { Document, Types } from 'mongoose';

// User Activity Analytics
export interface IUserActivity extends Document {
  userId: Types.ObjectId;
  sessionId: string;
  activity: {
    type: 'page_view' | 'match_join' | 'tournament_create' | 'message_send' | 'profile_update' | 'search' | 'api_call';
    resource: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
  };
  duration?: number; // milliseconds
  timestamp: Date;
  location?: {
    country: string;
    region: string;
    city: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
    userAgent: string;
  };
  performance?: {
    loadTime: number;
    responseTime: number;
    errors?: string[];
  };
}

// Application Performance Metrics
export interface IPerformanceMetrics extends Document {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  responseTime: number;
  statusCode: number;
  requestSize: number;
  responseSize: number;
  timestamp: Date;
  userId?: Types.ObjectId;
  requestErrors?: string[];
  dbQueries: {
    count: number;
    totalTime: number;
    slowQueries: Array<{
      query: string;
      time: number;
    }>;
  };
  cacheHits: number;
  cacheMisses: number;
}

// Business Intelligence Data
export interface IBusinessMetrics extends Document {
  metric: string;
  value: number;
  dimensions: Record<string, string | number>;
  timestamp: Date;
  aggregationType: 'sum' | 'average' | 'count' | 'min' | 'max';
  category: 'user_engagement' | 'performance' | 'revenue' | 'security' | 'content';
}

// Real-time System Health
export interface ISystemHealth extends Document {
  component: 'api' | 'database' | 'cache' | 'external_service' | 'queue';
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  errorRate: number;
  throughput: number;
  timestamp: Date;
  details?: Record<string, unknown>;
  alerts?: Array<{
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
  }>;
}

// Schemas
const userActivitySchema = new Schema<IUserActivity>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  activity: {
    type: {
      type: String,
      enum: ['page_view', 'match_join', 'tournament_create', 'message_send', 'profile_update', 'search', 'api_call'],
      required: true,
      index: true
    },
    resource: {
      type: String,
      required: true,
      index: true
    },
    resourceId: String,
    metadata: Schema.Types.Mixed
  },
  duration: Number,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  location: {
    country: String,
    region: String,
    city: String,
    coordinates: [Number]
  },
  device: {
    type: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
      required: true
    },
    os: String,
    browser: String,
    userAgent: String
  },
  performance: {
    loadTime: Number,
    responseTime: Number,
    errors: [String]
  }
}, {
  timestamps: true,
  collection: 'user_activities'
});

const performanceMetricsSchema = new Schema<IPerformanceMetrics>({
  endpoint: {
    type: String,
    required: true,
    index: true
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    required: true
  },
  responseTime: {
    type: Number,
    required: true,
    index: true
  },
  statusCode: {
    type: Number,
    required: true,
    index: true
  },
  requestSize: Number,
  responseSize: Number,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  requestErrors: [String],
  dbQueries: {
    count: { type: Number, default: 0 },
    totalTime: { type: Number, default: 0 },
    slowQueries: [{
      query: String,
      time: Number
    }]
  },
  cacheHits: { type: Number, default: 0 },
  cacheMisses: { type: Number, default: 0 }
}, {
  timestamps: true,
  collection: 'performance_metrics'
});

const businessMetricsSchema = new Schema<IBusinessMetrics>({
  metric: {
    type: String,
    required: true,
    index: true
  },
  value: {
    type: Number,
    required: true
  },
  dimensions: {
    type: Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  aggregationType: {
    type: String,
    enum: ['sum', 'average', 'count', 'min', 'max'],
    required: true
  },
  category: {
    type: String,
    enum: ['user_engagement', 'performance', 'revenue', 'security', 'content'],
    required: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'business_metrics'
});

const systemHealthSchema = new Schema<ISystemHealth>({
  component: {
    type: String,
    enum: ['api', 'database', 'cache', 'external_service', 'queue'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['healthy', 'degraded', 'down'],
    required: true,
    index: true
  },
  responseTime: {
    type: Number,
    required: true
  },
  errorRate: {
    type: Number,
    required: true
  },
  throughput: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  details: Schema.Types.Mixed,
  alerts: [{
    level: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical']
    },
    message: String,
    timestamp: Date
  }]
}, {
  timestamps: true,
  collection: 'system_health'
});

// Indexes for performance
userActivitySchema.index({ userId: 1, timestamp: -1 });
userActivitySchema.index({ 'activity.type': 1, timestamp: -1 });
userActivitySchema.index({ sessionId: 1, timestamp: -1 });

performanceMetricsSchema.index({ endpoint: 1, timestamp: -1 });
performanceMetricsSchema.index({ responseTime: -1, timestamp: -1 });
performanceMetricsSchema.index({ statusCode: 1, timestamp: -1 });

businessMetricsSchema.index({ metric: 1, category: 1, timestamp: -1 });
businessMetricsSchema.index({ category: 1, timestamp: -1 });

systemHealthSchema.index({ component: 1, timestamp: -1 });
systemHealthSchema.index({ status: 1, timestamp: -1 });

// TTL indexes for data retention
userActivitySchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 days
performanceMetricsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days
businessMetricsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }); // 1 year
systemHealthSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }); // 7 days

export const UserActivity = model<IUserActivity>('UserActivity', userActivitySchema);
export const PerformanceMetrics = model<IPerformanceMetrics>('PerformanceMetrics', performanceMetricsSchema);
export const BusinessMetrics = model<IBusinessMetrics>('BusinessMetrics', businessMetricsSchema);
export const SystemHealth = model<ISystemHealth>('SystemHealth', systemHealthSchema);