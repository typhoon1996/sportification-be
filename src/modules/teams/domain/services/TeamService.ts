import { Team } from '../../domain/models/Team';
import { TeamEventPublisher } from '../../events/publishers/TeamEventPublisher';
import { NotFoundError, ValidationError, ConflictError } from '../../../../shared/middleware/errorHandler';

export class TeamService {
  private eventPublisher: TeamEventPublisher;

  constructor() {
    this.eventPublisher = new TeamEventPublisher();
  }

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
