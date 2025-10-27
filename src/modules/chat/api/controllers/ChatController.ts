import {Response} from "express";
import {ChatService} from "../../domain/services/ChatService";
import {
  sendSuccess,
  sendCreated,
  asyncHandler,
} from "../../../../shared/middleware/errorHandler";
import {AuthRequest} from "../../../../shared/middleware/auth";
import logger from "../../../../shared/infrastructure/logging";

/**
 * ChatController - Handles real-time chat and messaging HTTP requests
 *
 * This controller manages chat rooms and messages for direct and group conversations.
 * It provides endpoints for creating chats, sending messages, and retrieving message history.
 * Works in conjunction with Socket.IO for real-time message delivery.
 *
 * Features:
 * - Direct and group chat creation
 * - Message sending with real-time updates
 * - Message history retrieval
 * - Participant management
 *
 * @class ChatController
 */
export class ChatController {
  private chatService: ChatService;

  /**
   * Initializes the ChatController with required services
   * Creates a new instance of ChatService for handling chat operations
   */
  constructor() {
    this.chatService = new ChatService();
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
   * Create a new chat room
   *
   * Creates a direct or group chat with specified participants. The authenticated
   * user is automatically added to the participants list. For direct chats, only
   * one other participant is allowed. Group chats can have multiple participants.
   *
   * Chat Types:
   * - "direct": One-on-one conversation (2 participants total)
   * - "group": Multi-user conversation (3+ participants)
   *
   * @async
   * @param {AuthRequest} req - Authenticated request with chat data
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 201 Created with chat details
   *
   * @requires Authentication - User must be authenticated
   *
   * @throws {ValidationError} If participant list is invalid or empty
   * @throws {ConflictError} If direct chat already exists between users
   *
   * @example
   * POST /api/v1/chats
   * Body: {
   *   participantIds: ["507f1f77bcf86cd799439012"],
   *   type: "direct"
   * }
   */
  createChat = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {participantIds, type} = req.body;
    const userId = this.getUserId(req);

    const chat = await this.chatService.createChat(
      userId,
      participantIds,
      type
    );

    await chat.populate("participants", "profile");

    logger.info(`Chat created by user: ${userId}`, {chatId: chat.id});

    sendCreated(res, {chat}, "Chat created successfully");
  });

  /**
   * Get user's chats
   *
   * Retrieves all chat rooms the authenticated user is a participant in.
   * Includes both direct and group chats, ordered by most recent activity.
   * Each chat includes basic information about other participants and the last message.
   *
   * @async
   * @param {AuthRequest} req - Authenticated request
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with list of chats
   *
   * @requires Authentication - User must be authenticated
   *
   * @example
   * GET /api/v1/chats
   * Headers: { Authorization: "Bearer <access-token>" }
   */
  getUserChats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const chats = await this.chatService.getUserChats(userId);

    sendSuccess(res, {chats});
  });

  /**
   * Get messages from a chat
   *
   * Retrieves message history from a specific chat room. Messages are returned
   * in reverse chronological order (newest first). User must be a participant
   * in the chat to view messages.
   *
   * @async
   * @param {AuthRequest} req - Authenticated request with chat ID parameter
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with message list
   *
   * @requires Authentication - User must be authenticated and be a chat participant
   *
   * @throws {NotFoundError} If chat doesn't exist
   * @throws {ForbiddenError} If user is not a participant in the chat
   *
   * Query Parameters:
   * - limit: Number of messages to retrieve (default: 50)
   *
   * @example
   * GET /api/v1/chats/507f1f77bcf86cd799439011/messages?limit=50
   * Headers: { Authorization: "Bearer <access-token>" }
   */
  getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const userId = this.getUserId(req);

    const messages = await this.chatService.getMessages(
      req.params.chatId as string,
      userId,
      limit
    );

    sendSuccess(res, {messages});
  });

  /**
   * Send a message in a chat
   *
   * Sends a new message in a chat room. The message is immediately stored and
   * broadcast to all participants via WebSocket. User must be a participant
   * in the chat to send messages.
   *
   * Real-time Behavior:
   * - Message is saved to database
   * - Message is broadcast to all online participants via Socket.IO
   * - Offline participants will see message when they reconnect
   *
   * @async
   * @param {AuthRequest} req - Authenticated request with message data
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 201 Created with message details
   *
   * @requires Authentication - User must be authenticated and be a chat participant
   *
   * @throws {NotFoundError} If chat doesn't exist
   * @throws {ForbiddenError} If user is not a participant in the chat
   * @throws {ValidationError} If message content is empty
   *
   * @example
   * POST /api/v1/chats/507f1f77bcf86cd799439011/messages
   * Headers: { Authorization: "Bearer <access-token>" }
   * Body: { content: "Hello team!" }
   */
  sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {content} = req.body;
    const userId = this.getUserId(req);

    const message = await this.chatService.sendMessage(
      req.params.chatId as string,
      userId,
      content
    );

    await message.populate("sender", "profile");

    logger.info(`Message sent by user: ${userId}`, {
      chatId: req.params.chatId,
      messageId: message.id,
    });

    sendCreated(res, {message}, "Message sent successfully");
  });
}

/**
 * Singleton instance of ChatController
 * Exported for use in route definitions
 * @const {ChatController}
 */
export const chatController = new ChatController();
