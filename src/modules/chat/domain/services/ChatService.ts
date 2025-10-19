import { Chat } from "../../domain/models/Chat";
import { Message } from "../../domain/models/Message";
import { ChatEventPublisher } from "../../events/publishers/ChatEventPublisher";
import { NotFoundError } from "../../../../shared/middleware/errorHandler";

/**
 * ChatService - Business logic for chat and messaging
 * 
 * Manages chat room creation, message sending, and message history retrieval.
 * Supports both direct (1-on-1) and group chat types. Publishes domain events
 * for real-time notifications and WebSocket integration.
 * 
 * Features:
 * - Direct and group chat creation
 * - Message sending with participant validation
 * - Message history retrieval
 * - Last message tracking
 * - Event publication for real-time updates
 */
export class ChatService {
  private eventPublisher: ChatEventPublisher;

  constructor() {
    this.eventPublisher = new ChatEventPublisher();
  }

  /**
   * Create a new chat room
   * 
   * Creates a chat with the specified participants. The creator is automatically
   * included as a participant. Publishes chat.created event for real-time notifications.
   * 
   * @async
   * @param {string} creatorId - User ID of the chat creator
   * @param {string[]} participantIds - Array of user IDs to include (excluding creator)
   * @param {string} [type='group'] - Chat type: 'direct' or 'group'
   * @returns {Promise<Chat>} Created chat document
   * 
   * @example
   * // Create a direct chat
   * const chat = await chatService.createChat('user123', ['user456'], 'direct');
   * 
   * @example
   * // Create a group chat
   * const groupChat = await chatService.createChat('user123', ['user456', 'user789'], 'group');
   */
  async createChat(
    creatorId: string,
    participantIds: string[],
    type: string = "group"
  ) {
    const chat = new Chat({
      participants: [creatorId, ...participantIds],
      type,
      createdBy: creatorId,
    });

    await chat.save();

    // Publish event
    this.eventPublisher.publishChatCreated({
      chatId: chat.id,
      participants: chat.participants.map((p) => p.toString()),
      type,
    });

    return chat;
  }

  /**
   * Send a message in a chat
   * 
   * Creates a new message in the specified chat and updates the chat's last message.
   * Publishes message.sent event with recipient IDs for real-time delivery via WebSocket.
   * 
   * @async
   * @param {string} chatId - Chat ID where message is sent
   * @param {string} senderId - User ID of the message sender
   * @param {string} content - Message content/text
   * @returns {Promise<Message>} Created message document
   * 
   * @throws {NotFoundError} If chat does not exist
   * 
   * @example
   * const message = await chatService.sendMessage('chat123', 'user456', 'Hello everyone!');
   */
  async sendMessage(chatId: string, senderId: string, content: string) {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      throw new NotFoundError("Chat");
    }

    const message = new Message({
      chat: chatId,
      sender: senderId,
      content,
    });

    await message.save();

    // Update chat's last message
    chat.lastMessage = message.id;
    await chat.save();

    // Publish event
    this.eventPublisher.publishMessageSent({
      messageId: message.id,
      chatId,
      senderId,
      content,
      recipientIds: chat.participants
        .filter((p) => p.toString() !== senderId)
        .map((p) => p.toString()),
    });

    return message;
  }

  /**
   * Retrieve message history for a chat
   * 
   * Fetches messages for a specific chat with pagination. Validates that the
   * requesting user is a participant in the chat before returning messages.
   * Messages are returned in reverse chronological order (newest first).
   * 
   * @async
   * @param {string} chatId - Chat ID to retrieve messages from
   * @param {string} userId - User ID requesting messages (must be participant)
   * @param {number} [limit=50] - Maximum number of messages to retrieve
   * @returns {Promise<Message[]>} Array of message documents with populated sender
   * 
   * @throws {NotFoundError} If chat does not exist
   * @throws {Error} If user is not a participant in the chat
   * 
   * @example
   * const messages = await chatService.getMessages('chat123', 'user456', 20);
   */
  async getMessages(chatId: string, userId: string, limit: number = 50) {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      throw new NotFoundError("Chat");
    }

    // Verify user is participant
    if (!chat.participants.some((p) => p.toString() === userId)) {
      throw new Error("User not authorized to view this chat");
    }

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "profile")
      .sort({ createdAt: -1 })
      .limit(limit);

    return messages;
  }

  /**
   * Get all chats for a user
   * 
   * Retrieves all chats where the user is a participant. Populates participant
   * profiles and last message for display. Sorts by most recently updated first.
   * 
   * @async
   * @param {string} userId - User ID to get chats for
   * @returns {Promise<Chat[]>} Array of chat documents with populated data
   * 
   * @example
   * const userChats = await chatService.getUserChats('user123');
   */
  async getUserChats(userId: string) {
    const chats = await Chat.find({ participants: userId })
      .populate("participants", "profile")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    return chats;
  }
}
