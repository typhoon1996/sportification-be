import {Tournament} from "../../../tournaments/domain/models/Tournament";
import {TournamentEventPublisher} from "../../events/publishers/TournamentEventPublisher";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "../../../../shared/middleware/errorHandler";
import {TournamentStatus} from "../../../../shared/types";

/**
 * TournamentService - Business logic for tournament management
 *
 * Manages tournament lifecycle including creation, participant registration,
 * bracket generation, and match progression. Supports multiple tournament formats
 * such as single-elimination, double-elimination, and round-robin.
 *
 * Features:
 * - Tournament creation with scheduling validation
 * - Bracket generation for various formats
 * - Participant registration and limits
 * - Match tracking and winner determination
 * - Status lifecycle management (upcoming → ongoing → completed)
 * - Event publication for notifications
 */
export class TournamentService {
  private eventPublisher: TournamentEventPublisher;

  constructor() {
    this.eventPublisher = new TournamentEventPublisher();
  }

  /**
   * Create a new tournament
   *
   * Creates a tournament with the specified format, schedule, and rules.
   * Validates that the start date is in the future. Sets initial status to 'upcoming'.
   * Publishes tournament.created event for notifications.
   *
   * @async
   * @param {string} userId - User ID of the tournament organizer
   * @param {Object} tournamentData - Tournament creation data
   * @param {string} tournamentData.name - Tournament name
   * @param {string} [tournamentData.sport='General'] - Sport/activity type
   * @param {Object} tournamentData.schedule - Tournament schedule
   * @param {Date} tournamentData.schedule.startDate - Tournament start date
   * @param {string} [tournamentData.format] - Tournament format (single-elimination, etc.)
   * @param {number} [tournamentData.maxParticipants] - Maximum number of participants
   * @return {Promise<Tournament>} Created tournament document
   *
   * @throws {ValidationError} If start date is not in the future
   *
   * @example
   * const tournament = await tournamentService.createTournament('user123', {
   *   name: 'Summer Championship',
   *   sport: 'basketball',
   *   schedule: { startDate: new Date('2025-07-01') },
   *   format: 'single-elimination',
   *   maxParticipants: 16
   * });
   */
  async createTournament(userId: string, tournamentData: any) {
    const startDate = new Date(tournamentData.schedule.startDate);
    if (startDate <= new Date()) {
      throw new ValidationError("Tournament start date must be in the future");
    }

    const tournament = new Tournament({
      ...tournamentData,
      organizer: userId,
      participants: [],
      status: "upcoming",
      sport: tournamentData.sport || "General",
      schedule: {
        ...tournamentData.schedule,
        startDate,
      },
    });

    await tournament.save();

    // Publish event
    this.eventPublisher.publishTournamentCreated({
      tournamentId: tournament.id,
      name: tournament.name,
      sport: tournament.sport || "General",
      organizerId: userId,
      startDate: tournament.startDate,
    });

    return tournament;
  }

  /**
   * Generate tournament bracket
   *
   * Creates the tournament bracket structure based on registered participants.
   * Only the tournament organizer can generate brackets. Tournament must be in
   * 'upcoming' status with at least 2 participants.
   *
   * Algorithm: Creates a single-elimination bracket by randomly shuffling participants
   * and pairing them for first-round matches. Calculates required rounds based on
   * participant count.
   *
   * @async
   * @param {string} tournamentId - Tournament ID to generate bracket for
   * @param {string} userId - User ID attempting to generate (must be organizer)
   * @return {Promise<Object>} Success response with generated bracket structure
   *
   * @throws {NotFoundError} If tournament does not exist
   * @throws {ValidationError} If user is not the organizer
   * @throws {ValidationError} If less than 2 participants registered
   * @throws {ConflictError} If tournament is not in 'upcoming' status
   *
   * @example
   * const result = await tournamentService.generateBracket('tournament123', 'organizer123');
   * // Returns: { success: true, bracket: { rounds: [...], totalRounds: 4 } }
   */
  async generateBracket(tournamentId: string, userId: string) {
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      throw new NotFoundError("Tournament");
    }

    if (tournament.createdBy.toString() !== userId) {
      throw new ValidationError(
        "Only tournament organizer can generate bracket"
      );
    }

    if (tournament.status !== TournamentStatus.UPCOMING) {
      throw new ConflictError(
        "Can only generate bracket for upcoming tournaments"
      );
    }

    if (tournament.participants.length < 2) {
      throw new ValidationError(
        "Need at least 2 participants to generate bracket"
      );
    }

    // Generate single-elimination bracket
    const bracket = this.createSingleEliminationBracket(
      tournament.participants
    );

    tournament.bracket = bracket;
    await tournament.save();

    return {success: true, bracket};
  }

  /**
   * Create single-elimination bracket structure
   *
   * Private helper method that generates a single-elimination bracket from
   * a list of participants. Randomly shuffles participants and pairs them
   * into matches. Calculates the number of rounds needed based on participant count.
   *
   * @private
   * @param {any[]} participants - Array of participant IDs
   * @return {Object} Bracket structure with rounds and matches
   */
  private createSingleEliminationBracket(participants: any[]): any {
    // Shuffle participants
    const shuffled = [...participants].sort(() => Math.random() - 0.5);

    // Calculate number of rounds needed
    const rounds = Math.ceil(Math.log2(shuffled.length));

    // Create bracket structure
    const bracket: any = {
      rounds: [],
      totalRounds: rounds,
    };

    // First round
    const firstRoundMatches = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        firstRoundMatches.push({
          participant1: shuffled[i],
          participant2: shuffled[i + 1],
          winner: null,
          round: 1,
        });
      } else {
        // Bye for odd participant
        firstRoundMatches.push({
          participant1: shuffled[i],
          participant2: null,
          winner: shuffled[i],
          round: 1,
        });
      }
    }

    bracket.rounds.push(firstRoundMatches);

    return bracket;
  }

  async getLeaderboard(tournamentId: string) {
    const tournament = await Tournament.findById(tournamentId).populate(
      "participants",
      "profile stats"
    );

    if (!tournament) {
      throw new NotFoundError("Tournament");
    }

    // Sort by standings if available
    if (tournament.standings && tournament.standings.length > 0) {
      return tournament.standings;
    }

    // Otherwise return participants sorted by stats
    return tournament.participants;
  }

  async joinTournament(userId: string, tournamentId: string) {
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      throw new NotFoundError("Tournament");
    }

    if (tournament.status !== "upcoming") {
      throw new ConflictError("Cannot join tournament that is not upcoming");
    }

    if (tournament.participants.includes(userId as any)) {
      throw new ConflictError("Already participating in this tournament");
    }

    if (
      tournament.maxParticipants &&
      tournament.participants.length >= tournament.maxParticipants
    ) {
      throw new ConflictError("Tournament is full");
    }

    tournament.participants.push(userId as any);
    await tournament.save();

    // Publish event
    this.eventPublisher.publishParticipantJoined({
      tournamentId: tournament.id,
      userId,
      participantCount: tournament.participants.length,
    });

    return tournament;
  }

  async leaveTournament(userId: string, tournamentId: string) {
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      throw new NotFoundError("Tournament");
    }

    if (!tournament.participants.includes(userId as any)) {
      throw new ConflictError("Not participating in this tournament");
    }

    if (tournament.status === "ongoing") {
      throw new ConflictError("Cannot leave tournament that is ongoing");
    }

    tournament.participants = tournament.participants.filter(
      p => p.toString() !== userId
    );
    await tournament.save();

    // Publish event
    this.eventPublisher.publishParticipantLeft({
      tournamentId: tournament.id,
      userId,
    });

    return {success: true};
  }

  async startTournament(tournamentId: string, userId: string) {
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      throw new NotFoundError("Tournament");
    }

    if (tournament.createdBy.toString() !== userId) {
      throw new ValidationError(
        "Only tournament organizer can start the tournament"
      );
    }

    if (tournament.status !== TournamentStatus.UPCOMING) {
      throw new ConflictError("Tournament is not in upcoming status");
    }

    if (tournament.participants.length < 2) {
      throw new ValidationError("Tournament must have at least 2 participants");
    }

    tournament.status = TournamentStatus.ONGOING;
    await tournament.save();

    // Publish event
    this.eventPublisher.publishTournamentStarted({
      tournamentId: tournament.id,
      participantCount: tournament.participants.length,
    });

    return tournament;
  }

  async updateTournament(tournamentId: string, userId: string, updates: any) {
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      throw new NotFoundError("Tournament");
    }

    if (tournament.createdBy.toString() !== userId) {
      throw new ValidationError(
        "Only tournament organizer can update the tournament"
      );
    }

    if (tournament.status === TournamentStatus.COMPLETED) {
      throw new ConflictError("Cannot update completed tournament");
    }

    Object.assign(tournament, updates);
    await tournament.save();

    return tournament;
  }

  async deleteTournament(tournamentId: string, userId: string) {
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      throw new NotFoundError("Tournament");
    }

    if (tournament.createdBy.toString() !== userId) {
      throw new ValidationError(
        "Only tournament organizer can delete the tournament"
      );
    }

    if (tournament.status === TournamentStatus.ONGOING) {
      throw new ConflictError("Cannot delete ongoing tournament");
    }

    await tournament.deleteOne();

    return {success: true};
  }
}
