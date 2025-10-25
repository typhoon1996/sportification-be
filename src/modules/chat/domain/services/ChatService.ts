import { Chat } from '../../domain/models/Chat';
import { Message } from '../../domain/models/Message';
import { IChat, IMessage } from '../../../../shared/types';
import { ChatEventPublisher } from '../../events/publishers/ChatEventPublisher';
import { NotFoundError } from '../../../../shared/middleware/errorHandler';
import {
  IChatService,
  IMessageService,
  IChatValidationService,
  IChatEventPublisher,
} from '../interfaces';
import { MessageService } from './MessageService';
import { ChatValidationService } from './ChatValidationService';

/**
 * ChatService - Main orchestration service for chat management (Refactored with SOLID)
 *
 * Orchestrates chat and messaging operations by delegating to specialized services.
 * Follows SOLID principles with dependency injection and single responsibility.
 *
 * Architecture:
 * - Delegates message operations to MessageService (SRP)
 * - Delegates validation to ChatValidationService (SRP)
 * - Depends on interfaces, not concrete implementations (DIP)
 * - Extensible through service swapping (OCP)
 *
 * SOLID Principles Applied:
 * - SRP: Orchestration only, delegates to specialized services
 * - DIP: Depends on IMessageService, IChatValidationService, IChatEventPublisher interfaces
 * - OCP: Can extend with new services without modifying this class
 * - LSP: Any implementation of interfaces can be substituted
 * - ISP: Interfaces are focused and single-purpose
 *
 * Features:
 * - Direct and group chat creation
 * - Message sending with participant validation
 * - Message history retrieval
 * - Last message tracking
 * - Event publication for real-time updates
 *
 * @example
 * // With dependency injection (testable)
 * const service = new ChatService(mockMessageService, mockValidationService, mockEventPublisher);
 *
 * // With default implementations (production)
 * const service = new ChatService();
 */
export class ChatService implements IChatService {
  private messageService: IMessageService;
  private validationService: IChatValidationService;
  private eventPublisher: IChatEventPublisher;

  /**
   * Constructor with dependency injection (DIP)
   *
   * Accepts service implementations via constructor, enabling:
   * - Easy mocking for unit tests
   * - Service swapping for different implementations
   * - Loose coupling between services
   *
   * @param messageService - Message handling service (default: MessageService)
   * @param validationService - Validation service (default: ChatValidationService)
   * @param eventPublisher - Event publisher (default: ChatEventPublisher)
   */
  constructor(
    messageService?: IMessageService,
    validationService?: IChatValidationService,
    eventPublisher?: IChatEventPublisher
  ) {
    this.messageService = messageService || new MessageService();
    this.validationService = validationService || new ChatValidationService();
    this.eventPublisher = eventPublisher || new ChatEventPublisher();
  }

  /**
   * Create a new chat room
   *
   * Creates a chat with the specified participants. The creator is automatically
   * included as a participant. Publishes chat.created event for real-time notifications.
   *
   * @param creatorId - User ID of the chat creator
   * @param participantIds - Array of user IDs to include (excluding creator)
   * @param type - Chat type: 'direct' or 'group' (default: 'group')
   * @returns Created chat document
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
    type: string = 'group'
  ): Promise<IChat> {
    // Delegate validation (SRP, DIP)
    this.validationService.validateChatCreation({
      creatorId,
      participantIds,
      type: type as 'direct' | 'group',
    });

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
   * Validates message content and participant access, then delegates message
   * sending to MessageService.
   *
   * @param chatId - Chat ID where message is sent
   * @param senderId - User ID of the message sender
   * @param content - Message content/text
   * @returns Created message document
   *
   * @throws {NotFoundError} If chat does not exist
   * @throws {ValidationError} If content is invalid or user not authorized
   *
   * @example
   * const message = await chatService.sendMessage('chat123', 'user456', 'Hello everyone!');
   */
  async sendMessage(
    chatId: string,
    senderId: string,
    content: string
  ): Promise<IMessage> {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      throw new NotFoundError('Chat');
    }

    // Delegate validation (SRP, DIP)
    this.validationService.validateParticipant(chat, senderId);
    this.validationService.validateMessageContent(content);

    // Delegate message handling (SRP, DIP)
    return this.messageService.sendMessage(
      chat,
      senderId,
      content,
      this.eventPublisher
    );
  }

  /**
   * Retrieve message history for a chat
   *
   * Validates participant access and delegates message retrieval to MessageService.
   * Messages are returned in reverse chronological order (newest first).
   *
   * @param chatId - Chat ID to retrieve messages from
   * @param userId - User ID requesting messages (must be participant)
   * @param limit - Maximum number of messages to retrieve (default: 50)
   * @returns Array of message documents with populated sender
   *
   * @throws {NotFoundError} If chat does not exist
   * @throws {ValidationError} If user is not a participant in the chat
   *
   * @example
   * const messages = await chatService.getMessages('chat123', 'user456', 20);
   */
  async getMessages(
    chatId: string,
    userId: string,
    limit: number = 50
  ): Promise<IMessage[]> {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      throw new NotFoundError('Chat');
    }

    // Delegate validation (SRP, DIP)
    this.validationService.validateParticipant(chat, userId);

    // Delegate message retrieval (SRP, DIP)
    return this.messageService.getMessages(chatId, limit);
  }

  /**
   * Get all chats for a user
   *
   * Retrieves all chats where the user is a participant. Populates participant
   * profiles and last message for display. Sorts by most recently updated first.
   *
   * @param userId - User ID to get chats for
   * @returns Array of chat documents with populated data
   *
   * @example
   * const userChats = await chatService.getUserChats('user123');
   */
  async getUserChats(userId: string): Promise<IChat[]> {
    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'profile')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    return chats;
  }
}
