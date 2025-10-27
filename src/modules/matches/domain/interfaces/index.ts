/**
 * Service Interfaces for Matches Module
 *
 * Following Dependency Inversion Principle
 */

import {IMatch} from "../../../../shared/types";
import {MatchStatus, MatchType} from "../../../../shared/types";

/**
 * Match data interface
 */
export interface IMatchData {
  sport: string;
  schedule: {
    date: Date | string;
    time: string;
  };
  venue: string;
  type?: MatchType;
  maxParticipants?: number;
  rules?: any;
}

/**
 * Match Validation Service Interface
 * Handles all match validation logic
 */
export interface IMatchValidationService {
  /**
   * Validate match schedule
   */
  validateSchedule(schedule: {date: Date | string; time: string}): void;

  /**
   * Validate participant can join
   */
  validateCanJoin(match: IMatch, userId: string): void;

  /**
   * Validate participant can leave
   */
  validateCanLeave(match: IMatch, userId: string): void;
}

/**
 * Match Participant Service Interface
 * Handles participant management
 */
export interface IMatchParticipantService {
  /**
   * Add participant to match
   */
  addParticipant(match: IMatch, userId: string): Promise<IMatch>;

  /**
   * Remove participant from match
   */
  removeParticipant(match: IMatch, userId: string): Promise<IMatch>;
}

/**
 * Match Service Interface
 * Main service for match operations
 */
export interface IMatchService {
  /**
   * Create a new match
   */
  createMatch(userId: string, matchData: IMatchData): Promise<IMatch>;

  /**
   * Join a match
   */
  joinMatch(userId: string, matchId: string): Promise<IMatch>;

  /**
   * Leave a match
   */
  leaveMatch(userId: string, matchId: string): Promise<IMatch>;

  /**
   * Get match by ID
   */
  getMatchById(matchId: string): Promise<IMatch>;

  /**
   * Update match status
   */
  updateMatchStatus(
    matchId: string,
    status: MatchStatus,
    userId: string
  ): Promise<IMatch>;

  /**
   * Cancel match
   */
  cancelMatch(matchId: string, userId: string): Promise<IMatch>;

  /**
   * Delete match
   */
  deleteMatch(matchId: string, userId: string): Promise<void>;
}

/**
 * Event Publisher Interface
 */
export interface IMatchEventPublisher {
  publishMatchCreated(payload: any): void;
  publishMatchCompleted(payload: any): void;
  publishMatchCancelled(payload: any): void;
  publishPlayerJoined(payload: any): void;
  publishPlayerLeft(payload: any): void;
  publishStatusChanged(payload: any): void;
  publishScoreUpdated(payload: any): void;
}
