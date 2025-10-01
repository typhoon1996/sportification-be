import { Request, Response } from 'express';
import { User } from '../models/User';
import { Profile } from '../models/Profile';
import { NotFoundError, sendSuccess, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { validatePagination, validateSort } from '../middleware/validation';

export class UserController {
  // Get all users
  static getUsers = asyncHandler(async (req: Request, res: Response) => {
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

  // Get user by ID
  static getUserById = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findOne({ _id: req.params.id, isActive: true })
      .populate('profile')
      .populate('achievements', 'name description icon points')
      .populate('friends', 'profile')
      .populate('followers', 'profile');

    if (!user) {
      throw new NotFoundError('User');
    }

    sendSuccess(res, user);
  });

  // Get user's friends
  static getUserFriends = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, skip } = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );

    const user = await User.findById(req.params.id || req.userId).populate({
      path: 'friends',
      populate: {
        path: 'profile',
        select: 'firstName lastName username avatar',
      },
      options: {
        skip,
        limit,
        sort: { 'profile.firstName': 1 },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    const totalFriends = user.friends.length;

    sendSuccess(res, {
      friends: user.friends,
      pagination: {
        page,
        limit,
        total: totalFriends,
        pages: Math.ceil(totalFriends / limit),
      },
    });
  });

  // Add friend
  static addFriend = asyncHandler(async (req: AuthRequest, res: Response) => {
    const friendId = req.params.friendId;

    if (friendId === req.userId) {
      throw new Error('Cannot add yourself as friend');
    }

    const [user, friend] = await Promise.all([User.findById(req.userId), User.findById(friendId)]);

    if (!friend || !friend.isActive) {
      throw new NotFoundError('User to add as friend');
    }

    if (!user) {
      throw new NotFoundError('User');
    }

    // Check if already friends
    if (user.friends.includes(friendId as any)) {
      throw new Error('Users are already friends');
    }

    // Add to friends list (bidirectional)
    user.friends.push(friendId as any);
    friend.followers.push(req.userId as any);

    await Promise.all([user.save(), friend.save()]);

    sendSuccess(res, null, 'Friend added successfully');
  });

  // Remove friend
  static removeFriend = asyncHandler(async (req: AuthRequest, res: Response) => {
    const friendId = req.params.friendId;

    const [user, friend] = await Promise.all([User.findById(req.userId), User.findById(friendId)]);

    if (!user) {
      throw new NotFoundError('User');
    }

    // Remove from friends list
    user.friends = user.friends.filter((id) => id.toString() !== friendId);

    if (friend) {
      friend.followers = friend.followers.filter((id) => id.toString() !== req.userId);
      await friend.save();
    }

    await user.save();

    sendSuccess(res, null, 'Friend removed successfully');
  });

  // Search users
  static searchUsers = asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query;
    const { limit } = validatePagination(req.query.page as string, req.query.limit as string);

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }

    const profiles = await Profile.searchProfiles(q.trim(), limit);

    const userIds = profiles.map((p) => p.user);
    const users = await User.find({
      _id: { $in: userIds },
      isActive: true,
    })
      .populate('profile', 'firstName lastName username avatar bio')
      .populate('achievements', 'name icon points')
      .limit(limit);

    sendSuccess(res, {
      users,
      query: q.trim(),
      count: users.length,
    });
  });

  // Get user stats
  static getUserStats = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findOne({ _id: req.params.id, isActive: true })
      .select('stats achievements friends followers')
      .populate('achievements', 'name points rarity');

    if (!user) {
      throw new NotFoundError('User');
    }

    const totalPoints = user.achievements.reduce((sum: number, achievement: any) => {
      return sum + (achievement.points || 0);
    }, 0);

    sendSuccess(res, {
      stats: user.stats,
      social: {
        friendCount: user.friends.length,
        followerCount: user.followers.length,
      },
      achievements: {
        total: user.achievements.length,
        totalPoints,
        achievements: user.achievements,
      },
    });
  });

  // Get current user profile
  static getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.userId)
      .populate('profile')
      .populate('achievements', 'name description icon points');

    if (!user) {
      throw new NotFoundError('User');
    }

    sendSuccess(res, { user });
  });

  // Update current user profile
  static updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const updates = req.body;

    const profile = await Profile.findOne({ user: req.userId });
    if (!profile) {
      throw new NotFoundError('Profile');
    }

    // Update profile fields
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        (profile as any)[key] = updates[key];
      }
    });

    await profile.save();

    // Populate the updated profile
    await profile.populate('user', 'email isEmailVerified');

    sendSuccess(res, { profile });
  });

  // Follow user
  static followUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const targetUserId = req.params.id;

    if (targetUserId === req.userId) {
      throw new Error('Cannot follow yourself');
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.userId),
      User.findById(targetUserId),
    ]);

    if (!targetUser || !targetUser.isActive) {
      throw new NotFoundError('User to follow');
    }

    if (!currentUser) {
      throw new NotFoundError('Current user');
    }

    // Check if already following
    if (targetUser.followers.includes(req.userId as any)) {
      throw new Error('Already following this user');
    }

    // Add follower/following relationship
    targetUser.followers.push(req.userId as any);
    currentUser.friends.push(targetUserId as any); // Using friends array as following

    await Promise.all([currentUser.save(), targetUser.save()]);

    sendSuccess(res, null, 'User followed successfully');
  });

  // Unfollow user
  static unfollowUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const targetUserId = req.params.id;

    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.userId),
      User.findById(targetUserId),
    ]);

    if (!currentUser) {
      throw new NotFoundError('Current user');
    }

    // Remove follower/following relationship
    if (targetUser) {
      targetUser.followers = targetUser.followers.filter((id) => id.toString() !== req.userId);
      await targetUser.save();
    }

    currentUser.friends = currentUser.friends.filter((id) => id.toString() !== targetUserId);
    await currentUser.save();

    sendSuccess(res, null, 'User unfollowed successfully');
  });

  // Get user followers
  static getUserFollowers = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );

    const user = await User.findById(req.params.id).populate({
      path: 'followers',
      populate: {
        path: 'profile',
        select: 'firstName lastName username avatar',
      },
      options: { skip, limit },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    sendSuccess(res, {
      followers: user.followers,
      pagination: {
        page,
        limit,
        total: user.followers.length,
        pages: Math.ceil(user.followers.length / limit),
      },
    });
  });

  // Get user following
  static getUserFollowing = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );

    const user = await User.findById(req.params.id).populate({
      path: 'friends', // Using friends as following
      populate: {
        path: 'profile',
        select: 'firstName lastName username avatar',
      },
      options: { skip, limit },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    sendSuccess(res, {
      following: user.friends,
      pagination: {
        page,
        limit,
        total: user.friends.length,
        pages: Math.ceil(user.friends.length / limit),
      },
    });
  });

  // Get user matches
  static getUserMatches = asyncHandler(async (req: Request, res: Response) => {
    // This would require Match model implementation
    res.status(501).json({
      success: false,
      message: 'Get user matches endpoint not yet implemented',
      errors: ['Match model not implemented'],
    });
  });

  // Get user achievements
  static getUserAchievements = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id).populate(
      'achievements',
      'name description icon points rarity category'
    );

    if (!user) {
      throw new NotFoundError('User');
    }

    sendSuccess(res, {
      achievements: user.achievements,
      total: user.achievements.length,
      totalPoints: user.achievements.reduce((sum: number, ach: any) => sum + (ach.points || 0), 0),
    });
  });
}
