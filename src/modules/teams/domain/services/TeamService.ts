import { Team } from '../../domain/models/Team';
import { TeamEventPublisher } from '../../events/publishers/TeamEventPublisher';
import { NotFoundError, ValidationError, ConflictError } from '../../../../shared/middleware/errorHandler';

/**
 * TeamService - Business logic for team management
 * 
 * Handles team lifecycle including creation, membership management, and updates.
 * Enforces business rules such as captain privileges, maximum member limits,
 * and member role validation. Publishes domain events for team activities.
 * 
 * Features:
 * - Team creation with captain assignment
 * - Member join/leave operations
 * - Captain-only team updates
 * - Maximum member capacity enforcement
 * - Event publication for integration
 */
export class TeamService {
  private eventPublisher: TeamEventPublisher;

  constructor() {
    this.eventPublisher = new TeamEventPublisher();
  }

  /**
   * Create a new team with the creator as captain
   * 
   * Automatically assigns the creator as the team captain and first member.
   * Sets default maximum members to 20 if not specified. Publishes team.created
   * event for other modules to react to.
   * 
   * @async
   * @param {string} creatorId - User ID of the team creator (becomes captain)
   * @param {Object} teamData - Team creation data
   * @param {string} teamData.name - Team name
   * @param {string} teamData.sport - Sport/activity type
   * @param {string} [teamData.description] - Team description
   * @param {number} [teamData.maxMembers=20] - Maximum number of members
   * @returns {Promise<Team>} Created team document with captain assigned
   * 
   * @example
   * const team = await teamService.createTeam('user123', {
   *   name: 'Thunder Squad',
   *   sport: 'basketball',
   *   description: 'Competitive basketball team',
   *   maxMembers: 15
   * });
   */
  async createTeam(creatorId: string, teamData: any) {
    const team = new Team({
      name: teamData.name,
      sport: teamData.sport,
      description: teamData.description,
      captain: creatorId,
      members: [
        {
          user: creatorId,
          role: 'captain',
          joinedAt: new Date(),
        },
      ],
      maxMembers: teamData.maxMembers || 20,
    });

    await team.save();

    // Publish event
    this.eventPublisher.publishTeamCreated({
      teamId: team.id,
      name: team.name,
      captainId: creatorId,
      sport: team.sport || 'Unknown',
    });

    return team;
  }

  /**
   * Add a user to an existing team
   * 
   * Validates that the user is not already a member and that the team
   * has not reached maximum capacity. Adds user to members list and
   * publishes team.memberJoined event.
   * 
   * @async
   * @param {string} userId - User ID of the member joining
   * @param {string} teamId - Team ID to join
   * @returns {Promise<Team>} Updated team document with new member
   * 
   * @throws {NotFoundError} If team does not exist
   * @throws {ConflictError} If user is already a member
   * @throws {ConflictError} If team has reached maximum member capacity
   * 
   * @example
   * const updatedTeam = await teamService.joinTeam('user456', 'team123');
   */
  async joinTeam(userId: string, teamId: string) {
    const team = await Team.findById(teamId);

    if (!team) {
      throw new NotFoundError('Team');
    }

    if (team.members.includes(userId as any)) {
      throw new ConflictError('Already a member of this team');
    }

    if (team.maxMembers && team.members.length >= team.maxMembers) {
      throw new ConflictError('Team is full');
    }

    team.members.push(userId as any);
    await team.save();

    // Publish event
    this.eventPublisher.publishMemberJoined({
      teamId: team.id,
      userId,
      memberCount: team.members.length,
    });

    return team;
  }

  /**
   * Remove a user from a team
   * 
   * Validates that the user is a member and not the captain (captains cannot leave).
   * Removes user from members list and publishes team.memberLeft event.
   * 
   * Business Rule: Team captain must transfer captaincy before leaving or delete the team.
   * 
   * @async
   * @param {string} userId - User ID of the member leaving
   * @param {string} teamId - Team ID to leave
   * @returns {Promise<Object>} Success confirmation { success: true }
   * 
   * @throws {NotFoundError} If team does not exist
   * @throws {ConflictError} If user is not a member
   * @throws {ConflictError} If user is the team captain (captains cannot leave)
   * 
   * @example
   * const result = await teamService.leaveTeam('user456', 'team123');
   */
  async leaveTeam(userId: string, teamId: string) {
    const team = await Team.findById(teamId);

    if (!team) {
      throw new NotFoundError('Team');
    }

    if (!team.members.includes(userId as any)) {
      throw new ConflictError('Not a member of this team');
    }

    if (team.captain.toString() === userId) {
      throw new ConflictError('Team captain cannot leave the team');
    }

    team.members = team.members.filter((m) => m.toString() !== userId);
    await team.save();

    // Publish event
    this.eventPublisher.publishMemberLeft({
      teamId: team.id,
      userId,
    });

    return { success: true };
  }

  /**
   * Update team details (captain only)
   * 
   * Allows team captain to update team information such as name, description,
   * and settings. Only the captain has permission to update team details.
   * 
   * @async
   * @param {string} teamId - Team ID to update
   * @param {string} userId - User ID attempting the update
   * @param {Object} updates - Team update data
   * @param {string} [updates.name] - New team name
   * @param {string} [updates.description] - New team description
   * @param {number} [updates.maxMembers] - New maximum member count
   * @returns {Promise<Team>} Updated team document
   * 
   * @throws {NotFoundError} If team does not exist
   * @throws {ValidationError} If user is not the team captain
   * 
   * @example
   * const updatedTeam = await teamService.updateTeam('team123', 'captain123', {
   *   name: 'New Team Name',
   *   description: 'Updated description',
   *   maxMembers: 25
   * });
   */
  async updateTeam(teamId: string, userId: string, updates: any) {
    const team = await Team.findById(teamId);

    if (!team) {
      throw new NotFoundError('Team');
    }

    if (team.captain.toString() !== userId) {
      throw new ValidationError('Only team captain can update the team');
    }

    Object.assign(team, updates);
    await team.save();

    return team;
  }

  async deleteTeam(teamId: string, userId: string) {
    const team = await Team.findById(teamId);

    if (!team) {
      throw new NotFoundError('Team');
    }

    if (team.captain.toString() !== userId) {
      throw new ValidationError('Only team captain can delete the team');
    }

    await team.deleteOne();

    return { success: true };
  }
}
