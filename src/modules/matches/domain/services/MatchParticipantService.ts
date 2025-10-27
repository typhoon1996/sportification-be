/**
 * MatchParticipantService - Match Participant Management
 *
 * Handles all participant-related operations following Single Responsibility Principle.
 * Only manages adding/removing participants, doesn't handle validation or other concerns.
 *
 * @class MatchParticipantService
 * @implements {IMatchParticipantService}
 */

import {IMatch} from "../../../../shared/types";
import {MatchEventPublisher} from "../../events/publishers/MatchEventPublisher";
import {IMatchParticipantService, IMatchEventPublisher} from "../interfaces";

export class MatchParticipantService implements IMatchParticipantService {
  private eventPublisher: IMatchEventPublisher;

  /**
   * Creates an instance of MatchParticipantService
   *
   * @param eventPublisher - Optional event publisher for dependency injection
   */
  constructor(eventPublisher?: IMatchEventPublisher) {
    this.eventPublisher = eventPublisher || new MatchEventPublisher();
  }

  /**
   * Add participant to match
   *
   * Adds a user to the match participants list and publishes an event.
   * Does not perform validation - validation should be done before calling this method.
   *
   * @param match - Match to add participant to
   * @param userId - User ID to add
   * @return Updated match with new participant
   *
   * @example
   * const updatedMatch = await participantService.addParticipant(match, userId);
   */
  async addParticipant(match: IMatch, userId: string): Promise<IMatch> {
    // Add participant
    match.participants.push(userId as any);
    await match.save();

    // Populate related fields
    await match.populate([
      {path: "createdBy", select: "profile"},
      {path: "participants", select: "profile"},
      {path: "venue", select: "name location"},
    ]);

    // Publish event
    this.eventPublisher.publishPlayerJoined({
      matchId: match.id,
      userId,
      sport: match.sport,
      participantCount: match.participants.length,
    });

    return match;
  }

  /**
   * Remove participant from match
   *
   * Removes a user from the match participants list and publishes an event.
   * Does not perform validation - validation should be done before calling this method.
   *
   * @param match - Match to remove participant from
   * @param userId - User ID to remove
   * @return Updated match with participant removed
   *
   * @example
   * const updatedMatch = await participantService.removeParticipant(match, userId);
   */
  async removeParticipant(match: IMatch, userId: string): Promise<IMatch> {
    // Remove participant
    match.participants = match.participants.filter(
      (p: any) => p.toString() !== userId && p._id?.toString() !== userId
    );
    await match.save();

    // Populate related fields
    await match.populate([
      {path: "createdBy", select: "profile"},
      {path: "participants", select: "profile"},
      {path: "venue", select: "name location"},
    ]);

    // Publish event
    this.eventPublisher.publishPlayerLeft({
      matchId: match.id,
      userId,
      sport: match.sport,
      participantCount: match.participants.length,
    });

    return match;
  }
}
