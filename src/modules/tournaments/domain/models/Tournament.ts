import { Schema, model, Model, Document, Types } from 'mongoose';
import { ITournament, TournamentStatus } from '../../../../shared/types';

const tournamentSchema = new Schema<ITournament>(
  {
    name: {
      type: String,
      required: [true, 'Tournament name is required'],
      trim: true,
      maxlength: [100, 'Tournament name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      trim: true,
    },
    matches: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Match',
      },
    ],
    bracket: {
      type: Schema.Types.Mixed,
      default: {},
    },
    standings: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    rules: {
      type: Schema.Types.Mixed,
      default: {},
    },
    chat: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
    },
    status: {
      type: String,
      enum: Object.values(TournamentStatus),
      required: [true, 'Tournament status is required'],
      default: TournamentStatus.UPCOMING,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      validate: {
        validator: function (date: Date) {
          return date > new Date();
        },
        message: 'Start date must be in the future',
      },
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (this: ITournament, endDate: Date) {
          if (!endDate) return true;
          return endDate > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    maxParticipants: {
      type: Number,
      min: [4, 'Tournament must allow at least 4 participants'],
      max: [256, 'Tournament cannot exceed 256 participants'],
    },
    entryFee: {
      type: Number,
      min: [0, 'Entry fee cannot be negative'],
      default: 0,
    },
    prizes: {
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
tournamentSchema.index({ status: 1, startDate: 1 });
tournamentSchema.index({ createdBy: 1 });
tournamentSchema.index({ participants: 1 });
tournamentSchema.index({ createdAt: -1 });
tournamentSchema.index({ name: 'text', description: 'text' });

// Virtual for participant count
tournamentSchema.virtual('participantCount').get(function () {
  return this.participants?.length || 0;
});

// Virtual for match count
tournamentSchema.virtual('matchCount').get(function () {
  return this.matches?.length || 0;
});

// Virtual to check if tournament is full
tournamentSchema.virtual('isFull').get(function () {
  if (!this.maxParticipants) return false;
  return this.participantCount >= this.maxParticipants;
});

// Virtual to check if tournament can start
tournamentSchema.virtual('canStart').get(function () {
  return (
    this.status === TournamentStatus.UPCOMING &&
    this.participantCount >= 4 &&
    new Date() >= this.startDate
  );
});

// Virtual for duration
tournamentSchema.virtual('duration').get(function () {
  if (!this.endDate) return null;

  const diffTime = this.endDate.getTime() - this.startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return '1 day';
  return `${diffDays} days`;
});

// Pre-save middleware to validate participants
tournamentSchema.pre('save', function (next) {
  if (this.maxParticipants && this.participants.length > this.maxParticipants) {
    return next(new Error('Number of participants exceeds maximum allowed'));
  }

  // Check for duplicate participants
  const uniqueParticipants = new Set(this.participants.map((p) => p.toString()));
  if (uniqueParticipants.size !== this.participants.length) {
    return next(new Error('Duplicate participants are not allowed'));
  }

  next();
});

// Static method to find tournaments by user
tournamentSchema.statics.findByUser = function (userId: string) {
  return this.find({
    $or: [{ participants: userId }, { createdBy: userId }],
  })
    .populate('createdBy', 'profile')
    .populate('participants', 'profile')
    .sort({ startDate: 1 });
};

// Static method to find upcoming tournaments
tournamentSchema.statics.findUpcoming = function (limit = 10) {
  return this.find({
    status: TournamentStatus.UPCOMING,
    startDate: { $gte: new Date() },
  })
    .limit(limit)
    .populate('createdBy', 'profile')
    .populate('participants', 'profile')
    .sort({ startDate: 1 });
};

// Static method to find ongoing tournaments
tournamentSchema.statics.findOngoing = function () {
  return this.find({
    status: TournamentStatus.ONGOING,
  })
    .populate('createdBy', 'profile')
    .populate('participants', 'profile')
    .populate('matches')
    .sort({ startDate: 1 });
};

// Instance method to add participant
tournamentSchema.methods.addParticipant = function (userId: string) {
  if (this.isFull) {
    throw new Error('Tournament is full');
  }

  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
  }
};

// Instance method to remove participant
tournamentSchema.methods.removeParticipant = function (userId: string) {
  if (this.status !== TournamentStatus.UPCOMING) {
    throw new Error('Cannot remove participants from started tournament');
  }

  this.participants = this.participants.filter((p: any) => p.toString() !== userId.toString());
};

// Instance method to check if user is participant
tournamentSchema.methods.isParticipant = function (userId: string): boolean {
  return this.participants.some((p: any) => p.toString() === userId.toString());
};

// Instance method to check if user is creator
tournamentSchema.methods.isCreator = function (userId: string): boolean {
  return this.createdBy.toString() === userId.toString();
};

// Instance method to start tournament
tournamentSchema.methods.startTournament = function () {
  if (!this.canStart) {
    throw new Error('Tournament cannot be started yet');
  }

  this.status = TournamentStatus.ONGOING;
  // Initialize bracket structure here
  this.bracket = this.generateBracket();
};

// Instance method to generate bracket
tournamentSchema.methods.generateBracket = function () {
  const participantCount = this.participants.length;

  if (participantCount < 4) {
    throw new Error('Tournament requires at least 4 participants');
  }

  // Calculate the number of rounds needed
  const rounds = Math.ceil(Math.log2(participantCount));

  // Generate bracket structure
  const bracket: any = {
    type: 'single-elimination',
    rounds: rounds,
    totalParticipants: participantCount,
    participants: [...this.participants], // Copy array
    matches: [],
    currentRound: 1,
    status: 'ready',
  };

  // Generate first round matches
  const shuffledParticipants = this.shuffleParticipants(bracket.participants);
  const firstRoundMatches = [];

  for (let i = 0; i < shuffledParticipants.length; i += 2) {
    const matchId = `match-${Date.now()}-${i / 2}`;

    // If odd number of participants, last participant gets a bye
    if (i + 1 >= shuffledParticipants.length) {
      firstRoundMatches.push({
        id: matchId,
        round: 1,
        position: i / 2,
        participant1: shuffledParticipants[i],
        participant2: null, // bye
        winner: shuffledParticipants[i], // automatic winner
        status: 'completed',
        isBye: true,
      });
    } else {
      firstRoundMatches.push({
        id: matchId,
        round: 1,
        position: i / 2,
        participant1: shuffledParticipants[i],
        participant2: shuffledParticipants[i + 1],
        winner: null,
        status: 'pending',
        isBye: false,
      });
    }
  }

  bracket.matches = firstRoundMatches;

  // Generate placeholder matches for subsequent rounds
  let previousRoundSize = firstRoundMatches.length;
  for (let round = 2; round <= rounds; round++) {
    const currentRoundSize = Math.ceil(previousRoundSize / 2);

    for (let position = 0; position < currentRoundSize; position++) {
      const matchId = `match-${Date.now()}-${round}-${position}`;
      bracket.matches.push({
        id: matchId,
        round: round,
        position: position,
        participant1: null, // TBD from previous round
        participant2: null, // TBD from previous round
        winner: null,
        status: 'waiting',
        isBye: false,
      });
    }

    previousRoundSize = currentRoundSize;
  }

  return bracket;
};

// Helper method to shuffle participants for randomization
tournamentSchema.methods.shuffleParticipants = function (participants: any[]) {
  const shuffled = [...participants];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Instance method to advance tournament bracket
tournamentSchema.methods.advanceBracket = function (matchId: string, winnerId: string) {
  if (!this.bracket || !this.bracket.matches) {
    throw new Error('Tournament bracket not initialized');
  }

  // Find the completed match
  const match = this.bracket.matches.find((m: any) => m.id === matchId);
  if (!match) {
    throw new Error('Match not found in bracket');
  }

  if (match.status !== 'pending') {
    throw new Error('Match is not in pending status');
  }

  // Validate winner is a participant in the match
  if (match.participant1?.toString() !== winnerId && match.participant2?.toString() !== winnerId) {
    throw new Error('Winner must be one of the match participants');
  }

  // Update match with winner
  match.winner = winnerId;
  match.status = 'completed';

  // Advance winner to next round if not final
  if (match.round < this.bracket.rounds) {
    const nextRoundPosition = Math.floor(match.position / 2);
    const nextMatch = this.bracket.matches.find(
      (m: any) => m.round === match.round + 1 && m.position === nextRoundPosition
    );

    if (nextMatch) {
      // Determine which slot in next match
      if (match.position % 2 === 0) {
        nextMatch.participant1 = winnerId;
      } else {
        nextMatch.participant2 = winnerId;
      }

      // Check if next match is ready to start
      if (nextMatch.participant1 && nextMatch.participant2) {
        nextMatch.status = 'pending';
      }
    }
  } else {
    // Tournament is complete
    this.status = TournamentStatus.COMPLETED;
    this.completeTournament(winnerId);
  }

  return this.bracket;
};

// Instance method to complete tournament
tournamentSchema.methods.completeTournament = function (winner?: string) {
  this.status = TournamentStatus.COMPLETED;

  if (winner) {
    // Move winner to top of standings
    this.standings = this.standings.filter((p: any) => p.toString() !== winner);
    this.standings.unshift(winner as any);
  }
};

export const Tournament = model<ITournament>('Tournament', tournamentSchema);
