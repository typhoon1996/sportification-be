/**
 * MatchValidationService - Match Validation Logic
 *
 * Handles all validation rules for matches following Single Responsibility Principle.
 * Only validates match business rules, doesn't perform any operations.
 *
 * @class MatchValidationService
 * @implements {IMatchValidationService}
 */

import {Match} from "../models/Match";
import {IMatch} from "../../../../shared/types";
import {IMatchValidationService} from "../interfaces";
import {
  ValidationError,
  ConflictError,
} from "../../../../shared/middleware/errorHandler";
import {MatchStatus} from "../../../../shared/types";

export class MatchValidationService implements IMatchValidationService {
  /**
   * Validate match schedule
   *
   * Ensures the match is scheduled for a future date.
   *
   * @param schedule - Match schedule with date and time
   * @throws {ValidationError} If date is in the past
   */
  validateSchedule(schedule: {date: Date | string; time: string}): void {
    const scheduledDate = new Date(schedule.date);
    if (scheduledDate <= new Date()) {
      throw new ValidationError("Match date must be in the future");
    }
  }

  /**
   * Validate participant can join match
   *
   * Checks all business rules for joining a match:
   * - Match must be in upcoming status
   * - User must not already be participating
   * - Match must not be at capacity
   *
   * @param match - Match to join
   * @param userId - User attempting to join
   * @throws {ConflictError} If validation fails
   */
  validateCanJoin(match: IMatch, userId: string): void {
    // Check match status
    if (match.status !== MatchStatus.UPCOMING) {
      throw new ConflictError("Can only join upcoming matches");
    }

    // Check if already participating
    const isParticipating = match.participants.some(
      (p: any) => p.toString() === userId || p._id?.toString() === userId
    );
    if (isParticipating) {
      throw new ConflictError("Already participating in this match");
    }

    // Check capacity
    if (
      (match as any).maxParticipants &&
      match.participants.length >= (match as any).maxParticipants
    ) {
      throw new ConflictError("Match is already full");
    }
  }

  /**
   * Validate participant can leave match
   *
   * Checks business rules for leaving a match:
   * - User must be participating
   * - Creator cannot leave their own match
   * - Match must not have already started
   *
   * @param match - Match to leave
   * @param userId - User attempting to leave
   * @throws {ConflictError} If validation fails
   */
  validateCanLeave(match: IMatch, userId: string): void {
    // Check if participating
    const isParticipating = match.participants.some(
      (p: any) => p.toString() === userId || p._id?.toString() === userId
    );
    if (!isParticipating) {
      throw new ConflictError("Not participating in this match");
    }

    // Creator cannot leave
    const creatorId =
      typeof match.createdBy === "object" && match.createdBy._id
        ? match.createdBy._id.toString()
        : match.createdBy.toString();

    if (creatorId === userId) {
      throw new ConflictError("Match creator cannot leave the match");
    }

    // Cannot leave if match has started
    if (match.status !== MatchStatus.UPCOMING) {
      throw new ConflictError("Cannot leave a match that has started");
    }
  }
}
