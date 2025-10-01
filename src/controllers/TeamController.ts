import { Request, Response } from 'express';
import { Team } from '../models/Team';
import { Chat } from '../models/Chat';
import { Notification } from '../models/Notification';
import { TeamRole, NotificationType } from '../types';
import logger from '../utils/logger';

/**
 * TeamController
 * Handles all team-related operations including creation, management, and member operations
 * @author Sports Companion Team
 */
export class TeamController {
  /**
   * Create a new team
   * @route POST /api/v1/teams
   */
  static async createTeam(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, sport, maxMembers } = req.body;
      const userId = (req as any).user.userId;

      // Create team chat
      const teamChat = await Chat.create({
        type: 'team',
        name: `${name} - Team Chat`,
        participants: [userId],
        isActive: true,
      });

      // Create team with creator as captain
      const team = await Team.create({
        name,
        description,
        sport,
        maxMembers,
        captain: userId,
        createdBy: userId,
        chat: teamChat._id,
        members: [
          {
            user: userId,
            role: TeamRole.CAPTAIN,
            joinedAt: new Date(),
          },
        ],
      });

      const populatedTeam = await Team.findById(team._id)
        .populate('captain', 'profile')
        .populate('members.user', 'profile')
        .populate('chat');

      logger.info(`Team created: ${team._id} by user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: { team: populatedTeam },
      });
    } catch (error: any) {
      logger.error('Error creating team:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create team',
        errors: [error.message],
      });
    }
  }

  /**
   * Get all teams with optional filters
   * @route GET /api/v1/teams
   */
  static async getTeams(req: Request, res: Response): Promise<void> {
    try {
      const { sport, search, page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const query: any = { isActive: true };

      if (sport) {
        query.sport = sport;
      }

      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }

      const teams = await Team.find(query)
        .populate('captain', 'profile')
        .populate('members.user', 'profile')
        .populate('chat')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const total = await Team.countDocuments(query);

      res.json({
        success: true,
        message: 'Teams retrieved successfully',
        data: {
          teams,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      logger.error('Error getting teams:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve teams',
        errors: [error.message],
      });
    }
  }

  /**
   * Get a specific team by ID
   * @route GET /api/v1/teams/:id
   */
  static async getTeam(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const team = await Team.findById(id)
        .populate('captain', 'profile')
        .populate('members.user', 'profile')
        .populate('chat')
        .populate('createdBy', 'profile');

      if (!team) {
        res.status(404).json({
          success: false,
          message: 'Team not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Team retrieved successfully',
        data: { team },
      });
    } catch (error: any) {
      logger.error('Error getting team:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve team',
        errors: [error.message],
      });
    }
  }

  /**
   * Get teams for the authenticated user
   * @route GET /api/v1/teams/my/teams
   */
  static async getMyTeams(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;

      const teams = await Team.findByUser(userId);

      res.json({
        success: true,
        message: 'User teams retrieved successfully',
        data: { teams },
      });
    } catch (error: any) {
      logger.error('Error getting user teams:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user teams',
        errors: [error.message],
      });
    }
  }

  /**
   * Update team information
   * @route PATCH /api/v1/teams/:id
   */
  static async updateTeam(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, sport, maxMembers } = req.body;
      const userId = (req as any).user.userId;

      const team = await Team.findById(id);

      if (!team) {
        res.status(404).json({
          success: false,
          message: 'Team not found',
        });
        return;
      }

      // Only captain can update team
      if (!team.isCaptain(userId)) {
        res.status(403).json({
          success: false,
          message: 'Only team captain can update team information',
        });
        return;
      }

      if (name) team.name = name;
      if (description !== undefined) team.description = description;
      if (sport !== undefined) team.sport = sport;
      if (maxMembers !== undefined) {
        if (maxMembers < team.memberCount) {
          res.status(400).json({
            success: false,
            message: 'Cannot set max members below current member count',
          });
          return;
        }
        team.maxMembers = maxMembers;
      }

      await team.save();

      const updatedTeam = await Team.findById(id)
        .populate('captain', 'profile')
        .populate('members.user', 'profile')
        .populate('chat');

      logger.info(`Team updated: ${team._id} by user ${userId}`);

      res.json({
        success: true,
        message: 'Team updated successfully',
        data: { team: updatedTeam },
      });
    } catch (error: any) {
      logger.error('Error updating team:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update team',
        errors: [error.message],
      });
    }
  }

  /**
   * Join a team
   * @route POST /api/v1/teams/:id/join
   */
  static async joinTeam(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const team = await Team.findById(id);

      if (!team) {
        res.status(404).json({
          success: false,
          message: 'Team not found',
        });
        return;
      }

      if (!team.isActive) {
        res.status(400).json({
          success: false,
          message: 'Team is not active',
        });
        return;
      }

      if (team.isMember(userId)) {
        res.status(400).json({
          success: false,
          message: 'User is already a member of this team',
        });
        return;
      }

      if (team.isFull) {
        res.status(400).json({
          success: false,
          message: 'Team is full',
        });
        return;
      }

      team.addMember(userId);
      await team.save();

      // Add user to team chat
      const chat = await Chat.findById(team.chat);
      if (chat) {
        chat.addParticipant(userId);
        await chat.save();
      }

      // Notify team captain
      await Notification.create({
        user: team.captain,
        type: NotificationType.TEAM,
        title: 'New Team Member',
        message: `A new member has joined your team: ${team.name}`,
        timestamp: new Date(),
        read: false,
        relatedEntity: {
          type: 'team',
          id: team._id,
        },
      });

      const updatedTeam = await Team.findById(id)
        .populate('captain', 'profile')
        .populate('members.user', 'profile')
        .populate('chat');

      logger.info(`User ${userId} joined team ${team._id}`);

      res.json({
        success: true,
        message: 'Successfully joined team',
        data: { team: updatedTeam },
      });
    } catch (error: any) {
      logger.error('Error joining team:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to join team',
        errors: [error.message],
      });
    }
  }

  /**
   * Leave a team
   * @route POST /api/v1/teams/:id/leave
   */
  static async leaveTeam(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const team = await Team.findById(id);

      if (!team) {
        res.status(404).json({
          success: false,
          message: 'Team not found',
        });
        return;
      }

      if (!team.isMember(userId)) {
        res.status(400).json({
          success: false,
          message: 'User is not a member of this team',
        });
        return;
      }

      if (team.isCaptain(userId)) {
        res.status(400).json({
          success: false,
          message: 'Captain cannot leave team. Transfer captaincy first.',
        });
        return;
      }

      team.removeMember(userId);
      await team.save();

      // Remove user from team chat
      const chat = await Chat.findById(team.chat);
      if (chat) {
        chat.removeParticipant(userId);
        await chat.save();
      }

      // Notify team captain
      await Notification.create({
        user: team.captain,
        type: NotificationType.TEAM,
        title: 'Team Member Left',
        message: `A member has left your team: ${team.name}`,
        timestamp: new Date(),
        read: false,
        relatedEntity: {
          type: 'team',
          id: team._id,
        },
      });

      logger.info(`User ${userId} left team ${team._id}`);

      res.json({
        success: true,
        message: 'Successfully left team',
      });
    } catch (error: any) {
      logger.error('Error leaving team:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to leave team',
        errors: [error.message],
      });
    }
  }

  /**
   * Remove a member from team (captain only)
   * @route DELETE /api/v1/teams/:id/members/:userId
   */
  static async removeMember(req: Request, res: Response): Promise<void> {
    try {
      const { id, userId: memberToRemove } = req.params;
      const userId = (req as any).user.userId;

      if (!memberToRemove) {
        res.status(400).json({
          success: false,
          message: 'Member user ID is required',
        });
        return;
      }

      const team = await Team.findById(id);

      if (!team) {
        res.status(404).json({
          success: false,
          message: 'Team not found',
        });
        return;
      }

      // Only captain can remove members
      if (!team.isCaptain(userId)) {
        res.status(403).json({
          success: false,
          message: 'Only team captain can remove members',
        });
        return;
      }

      if (!team.isMember(memberToRemove)) {
        res.status(400).json({
          success: false,
          message: 'User is not a member of this team',
        });
        return;
      }

      if (team.isCaptain(memberToRemove)) {
        res.status(400).json({
          success: false,
          message: 'Cannot remove captain',
        });
        return;
      }

      team.removeMember(memberToRemove);
      await team.save();

      // Remove user from team chat
      const chat = await Chat.findById(team.chat);
      if (chat) {
        chat.removeParticipant(memberToRemove);
        await chat.save();
      }

      // Notify removed member
      await Notification.create({
        user: memberToRemove,
        type: NotificationType.TEAM,
        title: 'Removed from Team',
        message: `You have been removed from team: ${team.name}`,
        timestamp: new Date(),
        read: false,
        relatedEntity: {
          type: 'team',
          id: team._id,
        },
      });

      logger.info(`User ${memberToRemove} removed from team ${team._id} by ${userId}`);

      res.json({
        success: true,
        message: 'Member removed successfully',
      });
    } catch (error: any) {
      logger.error('Error removing member:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove member',
        errors: [error.message],
      });
    }
  }

  /**
   * Update member role (captain only)
   * @route PATCH /api/v1/teams/:id/members/:userId/role
   */
  static async updateMemberRole(req: Request, res: Response): Promise<void> {
    try {
      const { id, userId: memberId } = req.params;
      const { role } = req.body;
      const userId = (req as any).user.userId;

      if (!memberId) {
        res.status(400).json({
          success: false,
          message: 'Member user ID is required',
        });
        return;
      }

      if (!Object.values(TeamRole).includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role',
        });
        return;
      }

      const team = await Team.findById(id);

      if (!team) {
        res.status(404).json({
          success: false,
          message: 'Team not found',
        });
        return;
      }

      // Only captain can update roles
      if (!team.isCaptain(userId)) {
        res.status(403).json({
          success: false,
          message: 'Only team captain can update member roles',
        });
        return;
      }

      if (!team.isMember(memberId)) {
        res.status(400).json({
          success: false,
          message: 'User is not a member of this team',
        });
        return;
      }

      team.updateMemberRole(memberId, role);
      await team.save();

      // Notify member of role change
      await Notification.create({
        user: memberId,
        type: NotificationType.TEAM,
        title: 'Role Updated',
        message: `Your role in team ${team.name} has been updated to ${role}`,
        timestamp: new Date(),
        read: false,
        relatedEntity: {
          type: 'team',
          id: team._id,
        },
      });

      const updatedTeam = await Team.findById(id)
        .populate('captain', 'profile')
        .populate('members.user', 'profile')
        .populate('chat');

      logger.info(`Member ${memberId} role updated in team ${team._id} by ${userId}`);

      res.json({
        success: true,
        message: 'Member role updated successfully',
        data: { team: updatedTeam },
      });
    } catch (error: any) {
      logger.error('Error updating member role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update member role',
        errors: [error.message],
      });
    }
  }

  /**
   * Transfer captaincy to another member
   * @route POST /api/v1/teams/:id/transfer-captaincy
   */
  static async transferCaptaincy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newCaptainId } = req.body;
      const userId = (req as any).user.userId;

      const team = await Team.findById(id);

      if (!team) {
        res.status(404).json({
          success: false,
          message: 'Team not found',
        });
        return;
      }

      // Only current captain can transfer captaincy
      if (!team.isCaptain(userId)) {
        res.status(403).json({
          success: false,
          message: 'Only team captain can transfer captaincy',
        });
        return;
      }

      if (!team.isMember(newCaptainId)) {
        res.status(400).json({
          success: false,
          message: 'New captain must be a member of the team',
        });
        return;
      }

      team.transferCaptaincy(newCaptainId);
      await team.save();

      // Notify new captain
      await Notification.create({
        user: newCaptainId,
        type: NotificationType.TEAM,
        title: 'Team Captain',
        message: `You are now the captain of team: ${team.name}`,
        timestamp: new Date(),
        read: false,
        relatedEntity: {
          type: 'team',
          id: team._id,
        },
      });

      // Notify team members
      team.members.forEach(async (member: any) => {
        if (member.user.toString() !== newCaptainId && member.user.toString() !== userId) {
          await Notification.create({
            user: member.user,
            type: NotificationType.TEAM,
            title: 'New Team Captain',
            message: `Team ${team.name} has a new captain`,
            timestamp: new Date(),
            read: false,
            relatedEntity: {
              type: 'team',
              id: team._id,
            },
          });
        }
      });

      const updatedTeam = await Team.findById(id)
        .populate('captain', 'profile')
        .populate('members.user', 'profile')
        .populate('chat');

      logger.info(`Captaincy transferred in team ${team._id} from ${userId} to ${newCaptainId}`);

      res.json({
        success: true,
        message: 'Captaincy transferred successfully',
        data: { team: updatedTeam },
      });
    } catch (error: any) {
      logger.error('Error transferring captaincy:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to transfer captaincy',
        errors: [error.message],
      });
    }
  }

  /**
   * Delete team (captain only)
   * @route DELETE /api/v1/teams/:id
   */
  static async deleteTeam(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const team = await Team.findById(id);

      if (!team) {
        res.status(404).json({
          success: false,
          message: 'Team not found',
        });
        return;
      }

      // Only captain can delete team
      if (!team.isCaptain(userId)) {
        res.status(403).json({
          success: false,
          message: 'Only team captain can delete team',
        });
        return;
      }

      // Deactivate team instead of deleting
      team.isActive = false;
      await team.save();

      // Deactivate team chat
      if (team.chat) {
        const chat = await Chat.findById(team.chat);
        if (chat) {
          chat.isActive = false;
          await chat.save();
        }
      }

      // Notify all members
      team.members.forEach(async (member: any) => {
        if (member.user.toString() !== userId) {
          await Notification.create({
            user: member.user,
            type: NotificationType.TEAM,
            title: 'Team Deleted',
            message: `Team ${team.name} has been deleted`,
            timestamp: new Date(),
            read: false,
          });
        }
      });

      logger.info(`Team deleted: ${team._id} by user ${userId}`);

      res.json({
        success: true,
        message: 'Team deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting team:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete team',
        errors: [error.message],
      });
    }
  }
}
