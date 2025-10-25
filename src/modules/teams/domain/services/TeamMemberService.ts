import {ITeam} from "../../../../shared/types";
import { Team } from '../models/Team';
import { ConflictError } from '../../../../shared/middleware/errorHandler';
import { ITeamMemberService, ITeamEventPublisher } from '../interfaces';

/**
 * TeamMemberService - Handles team member management (SRP)
 *
 * Single Responsibility: Manages team membership operations only.
 * Separated from TeamService to follow Single Responsibility Principle.
 *
 * Features:
 * - Add/remove members from teams
 * - Membership validation
 * - Capacity tracking
 * - Event publishing for member changes
 *
 * SOLID Principles Applied:
 * - SRP: Only handles member management, no validation or team lifecycle
 * - DIP: Accepts ITeamEventPublisher for event publishing
 * - OCP: Extensible through interfaces
 *
 * @example
 * const memberService = new TeamMemberService();
 * const updatedTeam = await memberService.addMember(team, userId, eventPublisher);
 */
export class TeamMemberService implements ITeamMemberService {
  /**
   * Add a user to a team
   *
   * Adds user to the team's members array with 'member' role and publishes
   * team.memberJoined event for integration with other modules.
   *
   * @param team - Team document to add member to
   * @param userId - User ID to add as member
   * @param eventPublisher - Event publisher for domain events
   * @returns Updated team document
   */
  async addMember(
    team: ITeam,
    userId: string,
    eventPublisher: ITeamEventPublisher
  ): Promise<ITeam> {
    // Add user to members
    team.members.push(userId as any);
    await team.save();

    // Publish domain event
    eventPublisher.publishMemberJoined({
      teamId: team.id,
      userId,
      memberCount: team.members.length,
    });

    return team;
  }

  /**
   * Remove a user from a team
   *
   * Removes user from the team's members array and publishes team.memberLeft
   * event for integration with other modules.
   *
   * @param team - Team document to remove member from
   * @param userId - User ID to remove
   * @param eventPublisher - Event publisher for domain events
   * @returns Success confirmation
   */
  async removeMember(
    team: ITeam,
    userId: string,
    eventPublisher: ITeamEventPublisher
  ): Promise<{ success: boolean }> {
    // Remove user from members
    team.members = team.members.filter((m: any) => m.toString() !== userId);
    await team.save();

    // Publish domain event
    eventPublisher.publishMemberLeft({
      teamId: team.id,
      userId,
    });

    return { success: true };
  }

  /**
   * Check if user is a member of the team
   *
   * @param team - Team document to check
   * @param userId - User ID to check for membership
   * @returns True if user is a member, false otherwise
   */
  isMember(team: ITeam, userId: string): boolean {
    return team.members.some((m: any) => m.toString() === userId);
  }

  /**
   * Check if team has capacity for new members
   *
   * @param team - Team document to check
   * @returns True if team can accept new members, false if at capacity
   */
  hasCapacity(team: ITeam): boolean {
    if (!team.maxMembers) return true;
    return team.members.length < team.maxMembers;
  }

  /**
   * Get current member count
   *
   * @param team - Team document
   * @returns Number of current members
   */
  getMemberCount(team: ITeam): number {
    return team.members.length;
  }
}
