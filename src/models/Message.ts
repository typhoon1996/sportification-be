import { Schema, model, Model } from 'mongoose';
import { IMessage, IMessageStatics } from '../types';

const messageSchema = new Schema<IMessage>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  chat: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: [true, 'Chat is required']
  },
  content: {
    type: String,
    required: function(this: IMessage) {
      // Content is required unless it's a media-only message
      return this.messageType === 'text' && !this.media?.length;
    },
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  media: [{
    type: Schema.Types.ObjectId,
    ref: 'Media'
  }],
  reactions: {
    type: Map,
    of: {
      users: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      count: {
        type: Number,
        default: 0
      }
    },
    default: new Map()
  },
  thread: {
    type: Schema.Types.ObjectId,
    ref: 'Thread'
  },
  messageType: {
    type: String,
    enum: ['text', 'media', 'system', 'file'],
    default: 'text',
    required: true
  },
  editedAt: {
    type: Date
  },
  deletedAt: {
    type: Date
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete (ret as any).__v;
      // Hide deleted messages content
      if (ret.deletedAt) {
        ret.content = '[Message deleted]';
        ret.media = [];
      }
      return ret;
    }
  }
});

// Indexes
messageSchema.index({ chat: 1, timestamp: -1 });
messageSchema.index({ sender: 1, timestamp: -1 });
messageSchema.index({ thread: 1, timestamp: 1 });

// Virtual for reaction count
messageSchema.virtual('totalReactions').get(function() {
  let total = 0;
  if (this.reactions) {
    Object.values(this.reactions).forEach((reaction: any) => {
      total += reaction.count || 0;
    });
  }
  return total;
});

// Virtual to check if message is edited
messageSchema.virtual('isEdited').get(function() {
  return !!this.editedAt;
});

// Virtual to check if message is deleted
messageSchema.virtual('isDeleted').get(function() {
  return !!this.deletedAt;
});

// Virtual for time ago
messageSchema.virtual('timeAgo').get(function() {
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

// Pre-save middleware to update chat's last activity and last message
messageSchema.pre('save', async function(next) {
  if (this.isNew && !this.deletedAt) {
    try {
      const Chat = model('Chat');
      await Chat.findByIdAndUpdate(this.chat, {
        lastMessage: this._id,
        lastActivity: this.timestamp
      });
    } catch (error) {
      // Log error but don't fail the message save
      console.error('Error updating chat last message:', error);
    }
  }
  next();
});

// Static method to find messages in chat
messageSchema.statics.findByChat = function(chatId: string, limit = 50, before?: Date) {
  const query: any = {
    chat: chatId,
    deletedAt: { $exists: false }
  };
  
  if (before) {
    query.timestamp = { $lt: before };
  }
  
  return this.find(query)
    .populate('sender', 'profile')
    .populate('media')
    .populate('replyTo', 'content sender')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Instance method to add reaction
messageSchema.methods.addReaction = function(emoji: string, userId: string) {
  if (!this.reactions.has(emoji)) {
    this.reactions.set(emoji, { users: [], count: 0 });
  }
  
  const reaction = this.reactions.get(emoji);
  if (reaction && !reaction.users.includes(userId)) {
    reaction.users.push(userId);
    reaction.count = reaction.users.length;
    this.reactions.set(emoji, reaction);
  }
};

// Instance method to remove reaction
messageSchema.methods.removeReaction = function(emoji: string, userId: string) {
  const reaction = this.reactions.get(emoji);
  if (reaction) {
    reaction.users = reaction.users.filter((id: any) => id.toString() !== userId);
    reaction.count = reaction.users.length;
    
    if (reaction.count === 0) {
      this.reactions.delete(emoji);
    } else {
      this.reactions.set(emoji, reaction);
    }
  }
};

// Instance method to soft delete
messageSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  this.content = '';
  this.media = [];
};

// Instance method to edit content
messageSchema.methods.editContent = function(newContent: string) {
  if (this.deletedAt) {
    throw new Error('Cannot edit deleted message');
  }
  
  this.content = newContent;
  this.editedAt = new Date();
};

export const Message = model<IMessage, Model<IMessage> & IMessageStatics>('Message', messageSchema);