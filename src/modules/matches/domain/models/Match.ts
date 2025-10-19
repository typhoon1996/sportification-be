import {Schema, model, Model, Document, Types} from "mongoose";
import {IMatch, MatchType, MatchStatus} from "../../../../shared/types";

const matchSchema = new Schema<IMatch>(
  {
    type: {
      type: String,
      enum: Object.values(MatchType),
      required: [true, "Match type is required"],
      default: MatchType.PUBLIC,
    },
    status: {
      type: String,
      enum: Object.values(MatchStatus),
      required: [true, "Match status is required"],
      default: MatchStatus.UPCOMING,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    schedule: {
      date: {
        type: Date,
        required: [true, "Match date is required"],
        validate: {
          validator: function (date: Date) {
            return date > new Date();
          },
          message: "Match date must be in the future",
        },
      },
      time: {
        type: String,
        required: [true, "Match time is required"],
        validate: {
          validator: function (time: string) {
            return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
          },
          message: "Time must be in HH:MM format",
        },
      },
      timezone: {
        type: String,
        required: [true, "Timezone is required"],
        default: "UTC",
      },
      duration: {
        type: Number, // Duration in minutes
        min: [1, "Duration must be at least 1 minute"],
        max: [480, "Duration cannot exceed 8 hours"],
      },
    },
    venue: {
      type: Schema.Types.ObjectId,
      ref: "Venue",
      required: [true, "Venue is required"],
    },
    rules: {
      type: Schema.Types.Mixed,
      default: {},
    },
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
    },
    sport: {
      type: String,
      required: [true, "Sport is required"],
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    scores: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    winner: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
    toObject: {
      virtuals: true,
    },
  }
);

// Indexes
matchSchema.index({status: 1, "schedule.date": 1});
matchSchema.index({createdBy: 1});
matchSchema.index({participants: 1});
matchSchema.index({venue: 1});
matchSchema.index({sport: 1});
matchSchema.index({createdAt: -1});

// Compound index for efficient queries
matchSchema.index({status: 1, type: 1, "schedule.date": 1});

// Virtual for participant count
matchSchema.virtual("participantCount").get(function () {
  return this.participants?.length || 0;
});

// Virtual for match duration formatted
matchSchema.virtual("formattedDuration").get(function () {
  if (!this.schedule.duration) return null;

  const hours = Math.floor(this.schedule.duration / 60);
  const minutes = this.schedule.duration % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Virtual for match date and time combined
matchSchema.virtual("scheduledDateTime").get(function () {
  if (!this.schedule.date || !this.schedule.time) return null;

  const dateStr = this.schedule.date.toISOString().split("T")[0];
  return new Date(`${dateStr}T${this.schedule.time}:00.000Z`);
});

// Virtual to check if match is upcoming
matchSchema.virtual("isUpcoming").get(function () {
  return (
    this.status === MatchStatus.UPCOMING &&
    this.scheduledDateTime &&
    this.scheduledDateTime > new Date()
  );
});

// Virtual to check if match is expired
matchSchema.virtual("isExpired").get(function () {
  if (this.status === MatchStatus.COMPLETED) return false;

  const scheduledTime = this.scheduledDateTime;
  if (!scheduledTime) return false;

  const now = new Date();
  const duration = this.schedule.duration || 120; // Default 2 hours
  const expirationTime = new Date(scheduledTime.getTime() + duration * 60000);

  return now > expirationTime;
});

// Pre-save middleware to auto-expire matches
matchSchema.pre("save", function (next) {
  // Auto-expire matches that are past their scheduled time + duration
  if (this.isExpired && this.status !== MatchStatus.COMPLETED) {
    this.status = MatchStatus.EXPIRED;
  }
  next();
});

// Pre-save middleware to validate participants
matchSchema.pre("save", function (next) {
  if (this.participants && this.participants.length < 2) {
    return next(new Error("Match must have at least 2 participants"));
  }

  // Check for duplicate participants
  const uniqueParticipants = new Set(this.participants.map(p => p.toString()));
  if (uniqueParticipants.size !== this.participants.length) {
    return next(new Error("Duplicate participants are not allowed"));
  }

  next();
});

// Static method to find matches by user
matchSchema.statics.findByUser = function (userId: string) {
  return this.find({
    participants: userId,
  })
    .populate("venue", "name location")
    .populate("participants", "profile")
    .populate("createdBy", "profile")
    .sort({"schedule.date": 1});
};

// Static method to find upcoming matches
matchSchema.statics.findUpcoming = function (limit = 10) {
  return this.find({
    status: MatchStatus.UPCOMING,
    "schedule.date": {$gte: new Date()},
  })
    .limit(limit)
    .populate("venue", "name location")
    .populate("participants", "profile")
    .sort({"schedule.date": 1});
};

// Static method to find matches by sport
matchSchema.statics.findBySport = function (sport: string, limit = 10) {
  return this.find({sport: new RegExp(sport, "i")})
    .limit(limit)
    .populate("venue", "name location")
    .populate("participants", "profile")
    .sort({"schedule.date": 1});
};

// Instance method to add participant
matchSchema.methods.addParticipant = function (userId: string) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
  }
};

// Instance method to remove participant
matchSchema.methods.removeParticipant = function (userId: string) {
  this.participants = this.participants.filter(
    (p: any) => p.toString() !== userId.toString()
  );
};

// Instance method to check if user is participant
matchSchema.methods.isParticipant = function (userId: string): boolean {
  return this.participants.some((p: any) => p.toString() === userId.toString());
};

// Instance method to check if user is creator
matchSchema.methods.isCreator = function (userId: string): boolean {
  return this.createdBy.toString() === userId.toString();
};

export const Match = model<IMatch>("Match", matchSchema);
