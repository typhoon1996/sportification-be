import { Tournament } from '../../../tournaments/domain/models/Tournament';
import { TournamentEventPublisher } from '../../events/publishers/TournamentEventPublisher';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../../../../shared/middleware/errorHandler';
import { TournamentStatus } from '../../../../shared/types';

export class TournamentService {
  private eventPublisher: TournamentEventPublisher;

  constructor() {
    this.eventPublisher = new TournamentEventPublisher();
  }

  async createTournament(userId: string, tournamentData: any) {
    const startDate = new Date(tournamentData.schedule.startDate);
    if (startDate <= new Date()) {
      throw new ValidationError('Tournament start date must be in the future');
    }

    const tournament = new Tournament({
      ...tournamentData,
      organizer: userId,
      participants: [],
      status: 'upcoming',
      sport: tournamentData.sport || 'General',
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
      sport: tournament.sport || 'General',
      organizerId: userId,
      startDate: tournament.startDate,
    });

    return tournament;
  }

  async generateBracket(tournamentId: string, userId: string) {
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      throw new NotFoundError('Tournament');
    }

    if (tournament.createdBy.toString() !== userId) {
      throw new ValidationError('Only tournament organizer can generate bracket');
    }

    if (tournament.status !== TournamentStatus.UPCOMING) {
      throw new ConflictError('Can only generate bracket for upcoming tournaments');
    }

    if (tournament.participants.length < 2) {
      throw new ValidationError('Need at least 2 participants to generate bracket');
    }

    // Generate single-elimination bracket
    const bracket = this.createSingleEliminationBracket(tournament.participants);

    tournament.bracket = bracket;
    await tournament.save();

    return { success: true, bracket };
  }

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
      'participants',
      'profile stats'
    );

    if (!tournament) {
      throw new NotFoundError('Tournament');
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
      throw new NotFoundError('Tournament');
    }

    if (tournament.status !== 'upcoming') {
      throw new ConflictError('Cannot join tournament that is not upcoming');
    }

    if (tournament.participants.includes(userId as any)) {
      throw new ConflictError('Already participating in this tournament');
    }

    if (
      tournament.maxParticipants &&
      tournament.participants.length >= tournament.maxParticipants
    ) {
      throw new ConflictError('Tournament is full');
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
      throw new NotFoundError('Tournament');
    }

    if (!tournament.participants.includes(userId as any)) {
      throw new ConflictError('Not participating in this tournament');
    }

    if (tournament.status === 'ongoing') {
      throw new ConflictError('Cannot leave tournament that is ongoing');
    }

    tournament.participants = tournament.participants.filter((p) => p.toString() !== userId);
    await tournament.save();

    // Publish event
    this.eventPublisher.publishParticipantLeft({
      tournamentId: tournament.id,
      userId,
    });

    return { success: true };
  }

  async startTournament(tournamentId: string, userId: string) {
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      throw new NotFoundError('Tournament');
    }

    if (tournament.createdBy.toString() !== userId) {
      throw new ValidationError('Only tournament organizer can start the tournament');
    }

    if (tournament.status !== TournamentStatus.UPCOMING) {
      throw new ConflictError('Tournament is not in upcoming status');
    }

    if (tournament.participants.length < 2) {
      throw new ValidationError('Tournament must have at least 2 participants');
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
      throw new NotFoundError('Tournament');
    }

    if (tournament.createdBy.toString() !== userId) {
      throw new ValidationError('Only tournament organizer can update the tournament');
    }

    if (tournament.status === TournamentStatus.COMPLETED) {
      throw new ConflictError('Cannot update completed tournament');
    }

    Object.assign(tournament, updates);
    await tournament.save();

    return tournament;
  }

  async deleteTournament(tournamentId: string, userId: string) {
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      throw new NotFoundError('Tournament');
    }

    if (tournament.createdBy.toString() !== userId) {
      throw new ValidationError('Only tournament organizer can delete the tournament');
    }

    if (tournament.status === TournamentStatus.ONGOING) {
      throw new ConflictError('Cannot delete ongoing tournament');
    }

    await tournament.deleteOne();

    return { success: true };
  }
}
