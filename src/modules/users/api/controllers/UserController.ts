import {Request, Response} from "express";
import logger from "../../../../shared/infrastructure/logging";
import {AuthRequest} from "../../../../shared/middleware/auth";
import {
  sendSuccess,
  asyncHandler,
} from "../../../../shared/middleware/errorHandler";
import {
  validatePagination,
  validateSort,
} from "../../../../shared/middleware/validation";
import {Profile} from "../../../users/domain/models/Profile";
import {User} from "../../../users/domain/models/User";
import {UserService} from "../../domain/services/UserService";

/**
 * UserController - Handles user management and social features HTTP requests
 *
 * This controller manages user profiles, friend relationships, and user search functionality.
 * It provides endpoints for viewing user information, managing friend connections,
 * and searching for users in the system.
 *
 * @class UserController
 */
export class UserController {
  private userService: UserService;

  /**
   * Initializes the UserController with required services
   * Creates a new instance of UserService for handling user-related business logic
   */
  constructor() {
    this.userService = new UserService();
  }

  /**
   * Helper method to extract and validate user ID from authenticated request
   *
   * @private
   * @param {AuthRequest} req - Authenticated request object
   * @return {string} User ID from the authenticated request
   * @throws {Error} If user is not authenticated
   */
  private getUserId(req: AuthRequest): string {
    if (!req.userId) {
      throw new Error("User not authenticated");
    }
    return req.userId;
  }

  /**
   * Get all users with pagination and search
   *
   * Retrieves a paginated list of active users. Supports search by name or username.
   * This endpoint is typically restricted to admins/moderators via route middleware.
   *
   * @async
   * @param {Request} req - Express request with query parameters (page, limit, search, sort)
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with paginated user list
   *
   * @requires Authorization - Admin or Moderator role (enforced by route middleware)
   *
   * @example
   * GET /api/v1/users?page=1&limit=20&search=john&sort=-createdAt
   */
  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const {page, limit, skip} = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );
    const sort = validateSort(req.query.sort as string);

    const filter: any = {isActive: true};

    // Apply search filter if provided - searches across name and username fields
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, "i");
      const profiles = await Profile.find({
        $or: [
          {firstName: searchRegex},
          {lastName: searchRegex},
          {username: searchRegex},
        ],
      }).select("user");

      const userIds = profiles.map(p => p.user);
      filter._id = {$in: userIds};
    }

    // Execute query and count in parallel for better performance
    const [users, total] = await Promise.all([
      User.find(filter)
        .populate("profile", "firstName lastName username avatar bio")
        .populate("achievements", "name icon points")
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

  /**
   * Get user by ID
   *
   * Retrieves detailed information about a specific user including their profile,
   * statistics, and public information. Available to all authenticated users.
   *
   * @async
   * @param {Request} req - Express request with user ID parameter
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with user details
   *
   * @throws {NotFoundError} If user with given ID doesn't exist
   *
   * @example
   * GET /api/v1/users/507f1f77bcf86cd799439011
   */
  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.userService.getUserById(req.params.id as string);
    sendSuccess(res, result);
  });

  /**
   * Update authenticated user's profile
   *
   * Updates the profile information for the currently authenticated user.
   * Users can only update their own profile (enforced by extracting userId from token).
   * Logs profile update events for audit purposes.
   *
   * @async
   * @param {AuthRequest} req - Authenticated request with profile update data
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with updated profile
   *
   * @requires Authentication - User must be authenticated via JWT access token
   *
   * @throws {ValidationError} If profile data doesn't meet validation requirements
   *
   * @example
   * PUT /api/v1/users/profile
   * Headers: { Authorization: "Bearer <access-token>" }
   * Body: {
   *   firstName: "John",
   *   lastName: "Doe",
   *   bio: "Sports enthusiast",
   *   location: { city: "New York", country: "USA" }
   * }
   */
  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const result = await this.userService.updateProfile(userId, req.body);

    logger.info(`Profile updated for user`, {
      userId,
      updates: Object.keys(req.body),
    });

    sendSuccess(res, result, "Profile updated successfully");
  });

  /**
   * Add friend connection
   *
   * Creates a bidirectional friendship between the authenticated user and another user.
   * Both users will see each other in their friends list after this operation.
   *
   * @async
   * @param {AuthRequest} req - Authenticated request with friend ID parameter
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with success message
   *
   * @requires Authentication - User must be authenticated via JWT access token
   *
   * @throws {NotFoundError} If target user doesn't exist
   * @throws {ConflictError} If friendship already exists or user tries to befriend themselves
   *
   * @example
   * POST /api/v1/users/507f1f77bcf86cd799439012/friend
   * Headers: { Authorization: "Bearer <access-token>" }
   */
  addFriend = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const friendId = req.params.friendId as string;

    await this.userService.addFriend(userId, friendId);

    sendSuccess(res, null, "Friend added successfully");
  });

  /**
   * Remove friend connection
   *
   * Removes the bidirectional friendship between the authenticated user and another user.
   * Both users will no longer see each other in their friends lists.
   *
   * @async
   * @param {AuthRequest} req - Authenticated request with friend ID parameter
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with success message
   *
   * @requires Authentication - User must be authenticated via JWT access token
   *
   * @throws {NotFoundError} If friendship doesn't exist
   *
   * @example
   * DELETE /api/v1/users/507f1f77bcf86cd799439012/friend
   * Headers: { Authorization: "Bearer <access-token>" }
   */
  removeFriend = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const friendId = req.params.friendId as string;

    await this.userService.removeFriend(userId, friendId);

    sendSuccess(res, null, "Friend removed successfully");
  });

  /**
   * Get user's friends list
   *
   * Retrieves the list of friends for a specific user. Users can view their own
   * friends list or any other user's public friends list.
   *
   * @async
   * @param {AuthRequest} req - Authenticated request, optionally with user ID parameter
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with friends list
   *
   * @requires Authentication - User must be authenticated via JWT access token
   *
   * @example
   * GET /api/v1/users/507f1f77bcf86cd799439011/friends
   * Headers: { Authorization: "Bearer <access-token>" }
   */
  getUserFriends = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.params.id || this.getUserId(req);
    const friends = await this.userService.getFriends(userId);

    sendSuccess(res, {friends});
  });

  /**
   * Search for users
   *
   * Performs a case-insensitive search across user names, usernames, and emails.
   * Returns matching users with basic profile information.
   *
   * @async
   * @param {Request} req - Express request with search query parameter
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with matching users
   *
   * @requires Authentication - User must be authenticated via JWT access token
   *
   * @example
   * GET /api/v1/users/search?q=john&limit=10
   * Headers: { Authorization: "Bearer <access-token>" }
   */
  searchUsers = asyncHandler(async (req: Request, res: Response) => {
    const query = (req.query.q as string) || "";
    const limit = parseInt(req.query.limit as string) || 20;

    const users = await this.userService.searchUsers(query, limit);

    sendSuccess(res, {users});
  });
}

/**
 * Singleton instance of UserController
 * Exported for use in route definitions
 * @const {UserController}
 */
export const userController = new UserController();
