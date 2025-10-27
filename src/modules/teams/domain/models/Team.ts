import {Schema, model, Model, Document, Types} from "mongoose";
import {ITeam, ITeamStatics, TeamRole} from "../../../../shared/types";

const teamMemberSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(TeamRole),
      required: true,
      default: TeamRole.PLAYER,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {_id: false}
);

const teamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
      maxlength: [100, "Team name cannot exceed 100 characters"],
      minlength: [2, "Team name must be at least 2 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    sport: {
      type: String,
      trim: true,
    },
    members: [teamMemberSchema],
    captain: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Team captain is required"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Team creator is required"],
    },
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    maxMembers: {
      type: Number,
      min: [2, "Team must have at least 2 members capacity"],
      max: [50, "Team cannot exceed 50 members"],
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
teamSchema.index({name: 1});
teamSchema.index({captain: 1});
teamSchema.index({createdBy: 1});
teamSchema.index({"members.user": 1});
teamSchema.index({sport: 1, isActive: 1});
teamSchema.index({isActive: 1, createdAt: -1});

// Virtual for member count
teamSchema.virtual("memberCount").get(function () {
  return this.members?.length || 0;
});

// Virtual to check if team is full
teamSchema.virtual("isFull").get(function () {
  if (!this.maxMembers) return false;
  return this.memberCount >= this.maxMembers;
});

// Pre-save validation
teamSchema.pre("save", function (next) {
  // Check if team is over capacity
  if (this.maxMembers && this.members.length > this.maxMembers) {
    return next(new Error("Team exceeds maximum member capacity"));
  }

  // Check for duplicate members
  const userIds = this.members.map(m => m.user.toString());
  const uniqueUserIds = new Set(userIds);
  if (uniqueUserIds.size !== userIds.length) {
    return next(new Error("Duplicate members are not allowed"));
  }

  // Ensure captain is a member of the team
  const captainIsMember = this.members.some(
    m => m.user.toString() === this.captain.toString()
  );
  if (!captainIsMember) {
    return next(new Error("Captain must be a member of the team"));
  }

  next();
});

// Static method to find teams by user
teamSchema.statics.findByUser = function (userId: string) {
  return this.find({
    "members.user": userId,
    isActive: true,
  })
    .populate("captain", "profile")
    .populate("members.user", "profile")
    .populate("chat")
    .sort({createdAt: -1});
};

// Static method to find teams by sport
teamSchema.statics.findBySport = function (sport: string, limit: number = 20) {
  return this.find({
    sport: sport,
    isActive: true,
  })
    .populate("captain", "profile")
    .populate("members.user", "profile")
    .limit(limit)
    .sort({createdAt: -1});
};

// Instance method to add member
teamSchema.methods.addMember = function (
  userId: string,
  role: TeamRole = TeamRole.PLAYER
) {
  if (this.isFull) {
    throw new Error("Team is full");
  }

  if (this.isMember(userId)) {
    throw new Error("User is already a member of this team");
  }

  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date(),
  });
};

// Instance method to remove member
teamSchema.methods.removeMember = function (userId: string) {
  if (this.isCaptain(userId)) {
    throw new Error("Cannot remove captain. Transfer captaincy first.");
  }

  this.members = this.members.filter(
    (m: any) => m.user.toString() !== userId.toString()
  );

  // Deactivate team if no members left
  if (this.members.length === 0) {
    this.isActive = false;
  }
};

// Instance method to check if user is member
teamSchema.methods.isMember = function (userId: string): boolean {
  return this.members.some((m: any) => m.user.toString() === userId.toString());
};

// Instance method to check if user is captain
teamSchema.methods.isCaptain = function (userId: string): boolean {
  return this.captain.toString() === userId.toString();
};

// Instance method to update member role
teamSchema.methods.updateMemberRole = function (
  userId: string,
  role: TeamRole
) {
  const member = this.members.find(
    (m: any) => m.user.toString() === userId.toString()
  );

  if (!member) {
    throw new Error("User is not a member of this team");
  }

  member.role = role;
};

// Instance method to transfer captaincy
teamSchema.methods.transferCaptaincy = function (newCaptainId: string) {
  if (!this.isMember(newCaptainId)) {
    throw new Error("New captain must be a member of the team");
  }

  // Update old captain's role to player
  const oldCaptain = this.members.find(
    (m: any) => m.user.toString() === this.captain.toString()
  );
  if (oldCaptain) {
    oldCaptain.role = TeamRole.PLAYER;
  }

  // Set new captain
  this.captain = newCaptainId;

  // Update new captain's role
  const newCaptain = this.members.find(
    (m: any) => m.user.toString() === newCaptainId.toString()
  );
  if (newCaptain) {
    newCaptain.role = TeamRole.CAPTAIN;
  }
};

export const Team = model<ITeam, Model<ITeam> & ITeamStatics>(
  "Team",
  teamSchema
);
