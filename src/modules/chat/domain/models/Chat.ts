import { Schema, model, Model } from 'mongoose';
import { IChat, IChatStatics } from '../../../../shared/types';

const chatSchema = new Schema<IChat>(
  {
    type: {
      type: String,
      enum: ['direct', 'group', 'match', 'tournament', 'team'],
      required: [true, 'Chat type is required'],
      default: 'direct',
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Chat name cannot exceed 100 characters'],
      validate: {
        validator: function (this: IChat, name: string) {
          // Name is required for group chats
          if (this.type === 'group' && !name) return false;
          return true;
        },
        message: 'Group chats must have a name',
      },
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],
    media: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Media',
      },
    ],
    reactions: {
      type: Schema.Types.Mixed,
      default: {},
    },
    threads: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Thread',
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
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
chatSchema.index({ participants: 1 });
chatSchema.index({ type: 1, lastActivity: -1 });
chatSchema.index({ lastActivity: -1 });

// Virtual for participant count
chatSchema.virtual('participantCount').get(function () {
  return this.participants?.length || 0;
});

// Virtual for message count
chatSchema.virtual('messageCount').get(function () {
  return this.messages?.length || 0;
});

// Pre-save validation
chatSchema.pre('save', function (next) {
  // Direct chats must have exactly 2 participants
  if (this.type === 'direct' && this.participants.length !== 2) {
    return next(new Error('Direct chats must have exactly 2 participants'));
  }

  // Group chats must have at least 3 participants
  if (this.type === 'group' && this.participants.length < 3) {
    return next(new Error('Group chats must have at least 3 participants'));
  }

  // Check for duplicate participants
  const uniqueParticipants = new Set(this.participants.map((p) => p.toString()));
  if (uniqueParticipants.size !== this.participants.length) {
    return next(new Error('Duplicate participants are not allowed'));
  }

  next();
});

// Static method to find chats by user
chatSchema.statics.findByUser = function (userId: string) {
  return this.find({
    participants: userId,
    isActive: true,
  })
    .populate('participants', 'profile')
    .populate('lastMessage', 'content sender timestamp')
    .sort({ lastActivity: -1 });
};

// Static method to find direct chat between two users
chatSchema.statics.findDirectChat = function (user1: string, user2: string) {
  return this.findOne({
    type: 'direct',
    participants: { $all: [user1, user2] },
  }).populate('participants', 'profile');
};

// Instance method to add participant
chatSchema.methods.addParticipant = function (userId: string) {
  if (this.type === 'direct') {
    throw new Error('Cannot add participants to direct chat');
  }

  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
    this.lastActivity = new Date();
  }
};

// Instance method to remove participant
chatSchema.methods.removeParticipant = function (userId: string) {
  if (this.type === 'direct') {
    throw new Error('Cannot remove participants from direct chat');
  }

  this.participants = this.participants.filter((p: any) => p.toString() !== userId);
  this.lastActivity = new Date();

  // Deactivate chat if no participants left
  if (this.participants.length === 0) {
    this.isActive = false;
  }
};

// Instance method to check if user is participant
chatSchema.methods.isParticipant = function (userId: string): boolean {
  return this.participants.some((p: any) => p.toString() === userId);
};

// Instance method to update last activity
chatSchema.methods.updateActivity = function () {
  this.lastActivity = new Date();
};

export const Chat = model<IChat, Model<IChat> & IChatStatics>('Chat', chatSchema);
