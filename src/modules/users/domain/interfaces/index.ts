/**
 * Service Interfaces for Users Module
 *
 * Following Dependency Inversion Principle - depend on abstractions, not concrete implementations.
 */

/**
 * User data interface
 */
export interface IUserData {
  id: string;
  email: string;
  profile: any;
  achievements?: any[];
  stats?: any;
  preferences?: any;
  isEmailVerified?: boolean;
  lastLoginAt?: Date;
}

/**
 * Profile update data
 */
export interface IProfileUpdate {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  phoneNumber?: string;
  preferences?: any;
  stats?: any;
}

/**
 * Search result interface
 */
export interface ISearchResult {
  users: any[];
  total: number;
  hasMore: boolean;
}

/**
 * Profile Service Interface
 * Handles user profile operations
 */
export interface IProfileService {
  /**
   * Update user profile
   * @param userId - User ID
   * @param updates - Profile updates
   * @returns Updated user data
   */
  updateProfile(userId: string, updates: IProfileUpdate): Promise<IUserData>;

  /**
   * Get user profile by ID
   * @param userId - User ID
   * @returns User profile data
   */
  getProfile(userId: string): Promise<IUserData>;
}

/**
 * Friend Service Interface
 * Handles friend relationship management
 */
export interface IFriendService {
  /**
   * Add a friend
   * @param userId - User ID
   * @param friendId - Friend's user ID
   * @returns Success indicator
   */
  addFriend(userId: string, friendId: string): Promise<{success: boolean}>;

  /**
   * Remove a friend
   * @param userId - User ID
   * @param friendId - Friend's user ID
   * @returns Success indicator
   */
  removeFriend(userId: string, friendId: string): Promise<{success: boolean}>;

  /**
   * Get user's friends
   * @param userId - User ID
   * @returns List of friends
   */
  getFriends(userId: string): Promise<any[]>;

  /**
   * Add multiple friends at once
   * @param userId - User ID
   * @param friendIds - Array of friend IDs
   * @returns Number of friends added
   */
  bulkAddFriends(
    userId: string,
    friendIds: string[]
  ): Promise<{success: boolean; added: number}>;
}

/**
 * User Service Interface
 * Main service for user operations
 */
export interface IUserService {
  /**
   * Get user by ID
   * @param userId - User ID
   * @returns User data
   */
  getUserById(userId: string): Promise<IUserData>;

  /**
   * Update user profile
   * @param userId - User ID
   * @param updates - Profile updates
   * @returns Updated user data
   */
  updateProfile(userId: string, updates: IProfileUpdate): Promise<IUserData>;

  /**
   * Add friend
   * @param userId - User ID
   * @param friendId - Friend ID
   * @returns Success indicator
   */
  addFriend(userId: string, friendId: string): Promise<{success: boolean}>;

  /**
   * Remove friend
   * @param userId - User ID
   * @param friendId - Friend ID
   * @returns Success indicator
   */
  removeFriend(userId: string, friendId: string): Promise<{success: boolean}>;

  /**
   * Get user's friends
   * @param userId - User ID
   * @returns List of friends
   */
  getFriends(userId: string): Promise<any[]>;

  /**
   * Search users
   * @param query - Search query
   * @param limit - Max results
   * @param offset - Pagination offset
   * @returns Search results
   */
  searchUsers(
    query: string,
    limit?: number,
    offset?: number
  ): Promise<ISearchResult>;

  /**
   * Get user stats
   * @param userId - User ID
   * @returns User statistics
   */
  getUserStats(userId: string): Promise<any>;

  /**
   * Update user stats
   * @param userId - User ID
   * @param statsUpdate - Stats to update
   * @returns Updated stats
   */
  updateUserStats(userId: string, statsUpdate: any): Promise<any>;

  /**
   * Deactivate user
   * @param userId - User ID
   * @returns Success indicator
   */
  deactivateUser(userId: string): Promise<{success: boolean}>;

  /**
   * Reactivate user
   * @param userId - User ID
   * @returns Success indicator
   */
  reactivateUser(userId: string): Promise<{success: boolean}>;

  /**
   * Bulk add friends
   * @param userId - User ID
   * @param friendIds - Friend IDs
   * @returns Number added
   */
  bulkAddFriends(
    userId: string,
    friendIds: string[]
  ): Promise<{success: boolean; added: number}>;
}

/**
 * Event Publisher Interface
 */
export interface IUserEventPublisher {
  publishProfileUpdated(payload: any): void;
  publishFriendAdded(payload: any): void;
  publishFriendRemoved(payload: any): void;
  publishStatsUpdated(payload: any): void;
}
