import { Schema, model } from 'mongoose';
import { INotification, NotificationType } from '../../../../shared/types';

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    action: {
      type: Schema.Types.Mixed,
      default: {},
    },
    relatedEntity: {
      type: {
        type: String,
        enum: ['match', 'tournament', 'user', 'chat', 'message'],
      },
      id: {
        type: Schema.Types.ObjectId,
      },
    },
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 }, // TTL index
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Indexes
notificationSchema.index({ user: 1, read: 1, timestamp: -1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ timestamp: -1 });

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function () {
  const now = new Date();
  const diffMs = now.getTime() - this.timestamp.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
});

// Static method to find unread notifications for user
notificationSchema.statics.findUnreadByUser = function (userId: string) {
  return this.find({ user: userId, read: false })
    .sort({ timestamp: -1 })
    .populate('relatedEntity.id');
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = function (userId: string) {
  return this.updateMany({ user: userId, read: false }, { read: true });
};

export const Notification = model<INotification>('Notification', notificationSchema);
