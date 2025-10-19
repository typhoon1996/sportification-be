/**
 * Chat Module - Service Interfaces
 *
 * Defines contracts for chat and messaging services following SOLID principles.
 * These interfaces enable dependency injection, testability, and extensibility.
 *
 * Architecture:
 * - IChatService: Main orchestration service
 * - IMessageService: Message handling operations
 * - IChatValidationService: Business rule validation
 * - IChatEventPublisher: Domain event publishing
 */

import { Chat } from '../models/Chat';
import { Message } from '../models/Message';

/**
 * Chat creation data
 */
export interface IChatCreationData {
  creatorId: string;
  participantIds: string[];
  type?: 'direct' | 'group';
}

/**
 * Message sending data
 */
export interface IMessageData {
  chatId: string;
  senderId: string;
  content: string;
}

/**
 * Chat event publisher interface
 *
 * Abstracts event publishing for chat-related domain events.
 * Enables decoupling from specific event bus implementations.
 */
export interface IChatEventPublisher {
  publishChatCreated(data: {
    chatId: string;
    participants: string[];
    type: string;
  }): void;

  publishMessageSent(data: {
    messageId: string;
    chatId: string;
    senderId: string;
    content: string;
    recipientIds: string[];
  }): void;
}

/**
 * Message handling service interface (SRP)
 *
 * Handles all message-related operations: sending, retrieving, managing.
 * Separated from main ChatService to follow Single Responsibility Principle.
 *
 * Responsibilities:
 * - Send messages
 * - Retrieve message history
 * - Update last message
 * - Message validation
 */
export interface IMessageService {
  /**
   * Send a message in a chat
   */
  sendMessage(
    chat: Chat,
    senderId: string,
    content: string,
    eventPublisher: IChatEventPublisher
  ): Promise<Message>;

  /**
   * Get messages for a chat with pagination
   */
  getMessages(chatId: string, limit?: number): Promise<Message[]>;

  /**
   * Update chat's last message reference
   */
  updateLastMessage(chat: Chat, messageId: string): Promise<void>;
}

/**
 * Chat validation service interface (SRP)
 *
 * Handles all business rule validation for chat operations.
 * Separated from main ChatService to follow Single Responsibility Principle.
 *
 * Responsibilities:
 * - Validate participant access
 * - Validate chat type
 * - Enforce business rules
 */
export interface IChatValidationService {
  /**
   * Validate user is participant in chat
   */
  validateParticipant(chat: Chat, userId: string): void;

  /**
   * Validate chat creation data
   */
  validateChatCreation(data: IChatCreationData): void;

  /**
   * Validate message content
   */
  validateMessageContent(content: string): void;
}

/**
 * Main chat service interface (DIP)
 *
 * Orchestrates chat operations by delegating to specialized services.
 * Depends on abstractions (interfaces) not concrete implementations.
 *
 * Responsibilities:
 * - Chat lifecycle management
 * - Orchestrate specialized services
 * - Coordinate database operations
 * - Manage transactions
 */
export interface IChatService {
  /**
   * Create a new chat room
   */
  createChat(
    creatorId: string,
    participantIds: string[],
    type?: string
  ): Promise<Chat>;

  /**
   * Send a message in a chat
   */
  sendMessage(chatId: string, senderId: string, content: string): Promise<Message>;

  /**
   * Get message history for a chat
   */
  getMessages(chatId: string, userId: string, limit?: number): Promise<Message[]>;

  /**
   * Get all chats for a user
   */
  getUserChats(userId: string): Promise<Chat[]>;
}
