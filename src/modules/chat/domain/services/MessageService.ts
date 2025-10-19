import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { IChatEventPublisher, IMessageService } from '../interfaces';

/**
 * MessageService - Handles message operations (SRP)
 *
 * Single Responsibility: Manages message sending and retrieval only.
 * Separated from ChatService to follow Single Responsibility Principle.
 *
 * Features:
 * - Send messages in chats
 * - Retrieve message history with pagination
 * - Update last message reference
 * - Event publishing for real-time updates
 *
 * SOLID Principles Applied:
 * - SRP: Only handles messages, no chat creation or validation
 * - DIP: Accepts IChatEventPublisher for event publishing
 * - OCP: Extensible through interfaces
 *
 * @example
 * const messageService = new MessageService();
 * const message = await messageService.sendMessage(chat, senderId, content, eventPublisher);
 */
export class MessageService implements IMessageService {
  /**
   * Send a message in a chat
   *
   * Creates a new message document, updates the chat's last message reference,
   * and publishes message.sent event for real-time delivery via WebSocket.
   *
   * @param chat - Chat document where message is sent
   * @param senderId - User ID of message sender
   * @param content - Message text content
   * @param eventPublisher - Event publisher for domain events
   * @returns Created message document
   */
  async sendMessage(
    chat: Chat,
    senderId: string,
    content: string,
    eventPublisher: IChatEventPublisher
  ): Promise<Message> {
    // Create message
    const message = new Message({
      chat: chat.id,
      sender: senderId,
      content,
    });

    await message.save();

    // Update chat's last message
    await this.updateLastMessage(chat, message.id);

    // Publish domain event with recipient IDs for real-time delivery
    eventPublisher.publishMessageSent({
      messageId: message.id,
      chatId: chat.id,
      senderId,
      content,
      recipientIds: chat.participants
        .filter((p) => p.toString() !== senderId)
        .map((p) => p.toString()),
    });

    return message;
  }

  /**
   * Get message history for a chat
   *
   * Retrieves messages with pagination, populates sender information,
   * and sorts by creation time (newest first).
   *
   * @param chatId - Chat ID to retrieve messages from
   * @param limit - Maximum number of messages to retrieve (default: 50)
   * @returns Array of message documents with populated sender
   */
  async getMessages(chatId: string, limit: number = 50): Promise<Message[]> {
    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'profile')
      .sort({ createdAt: -1 })
      .limit(limit);

    return messages;
  }

  /**
   * Update chat's last message reference
   *
   * Updates the chat document to track the most recent message.
   * Used for displaying last message in chat lists.
   *
   * @param chat - Chat document to update
   * @param messageId - ID of the last message
   */
  async updateLastMessage(chat: Chat, messageId: string): Promise<void> {
    chat.lastMessage = messageId as any;
    await chat.save();
  }
}
