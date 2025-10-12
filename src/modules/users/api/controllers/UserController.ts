import { Request, Response } from 'express';
import { UserService } from '../../domain/services/UserService';
import { sendSuccess, asyncHandler } from '../../../../shared/middleware/errorHandler';
import { AuthRequest } from '../../../../shared/middleware/auth';
import { validatePagination, validateSort } from '../../../../shared/middleware/validation';
import { User } from '../../../users/domain/models/User';
import { Profile } from '../../../users/domain/models/Profile';
import logger from '../../../../shared/infrastructure/logging';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  private getUserId(req: AuthRequest): string {
    if (!req.userId) {
      throw new Error('User not authenticated');
    }
    return req.userId;
  }

  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );
    const sort = validateSort(req.query.sort as string);

    const filter: any = { isActive: true };

    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      const profiles = await Profile.find({
        $or: [{ firstName: searchRegex }, { lastName: searchRegex }, { username: searchRegex }],
      }).select('user');

      const userIds = profiles.map((p) => p.user);
      filter._id = { $in: userIds };
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('profile', 'firstName lastName username avatar bio')
        .populate('achievements', 'name icon points')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    sendSuccess(res, {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.userService.getUserById(req.params.id as string);
    sendSuccess(res, result);
  });

  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const result = await this.userService.updateProfile(userId, req.body);

    logger.info(`Profile updated for user`, {
      userId,
      updates: Object.keys(req.body),
    });

    sendSuccess(res, result, 'Profile updated successfully');
  });

  addFriend = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const friendId = req.params.friendId as string;

    await this.userService.addFriend(userId, friendId);

    sendSuccess(res, null, 'Friend added successfully');
  });

  removeFriend = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const friendId = req.params.friendId as string;

    await this.userService.removeFriend(userId, friendId);

    sendSuccess(res, null, 'Friend removed successfully');
  });

  getUserFriends = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.params.id || this.getUserId(req);
    const friends = await this.userService.getFriends(userId);

    sendSuccess(res, { friends });
  });

  searchUsers = asyncHandler(async (req: Request, res: Response) => {
    const query = (req.query.q as string) || '';
    const limit = parseInt(req.query.limit as string) || 20;

    const users = await this.userService.searchUsers(query, limit);

    sendSuccess(res, { users });
  });
}

export const userController = new UserController();
