import { Request, Response } from 'express';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  sendSuccess,
  sendCreated,
  asyncHandler,
} from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { validatePagination } from '../middleware/validation';
import { ChatType, MessageType } from '../types';

/**
 * ChatController handles all chat-related operations
 * including creating chats, sending messages, and managing participants.
 *
 * Features:
 * - Create direct and group chats
 * - Real-time messaging with Socket.IO integration
 * - Message reactions and replies
 * - Participant management for group chats
 * - Message editing and soft deletion
 * - Chat statistics and analytics
 *
 * @author Sports Companion Team
 * @version 1.0.0
 */
export class ChatController {
  /**
   * Get user's chats with pagination and filtering
   *
   * @param req - Express request with user authentication
   * @param res - Express response
   * @returns Promise<void>
   *
   * @example
   * GET /api/v1/chats?page=1&limit=20&type=group
   */
  static getChats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, skip } = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );

    const filter: Record<string, any> = {
      participants: req.userId,
      isActive: true,
    };

    // Filter by chat type
    if (req.query.type) {
      filter.type = req.query.type;
    }

    const [chats, total] = await Promise.all([
      Chat.find(filter)
        .populate('participants', 'profile email')
        .populate('lastMessage', 'content sender timestamp messageType')
        .sort({ lastActivity: -1 })
        .skip(skip)
        .limit(limit),
      Chat.countDocuments(filter),
    ]);

    sendSuccess(res, {
      chats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  /**
   * Get chat by ID with messages
   */
  static getChatById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const chat = await Chat.findById(req.params.id)
      .populate('participants', 'profile email')
      .populate('lastMessage', 'content sender timestamp messageType');

    if (!chat) {
      throw new NotFoundError('Chat');
    }

    // Check if user is participant
    if (!chat.isParticipant(req.userId!)) {
      throw new BadRequestError('You are not a participant in this chat');
    }

    // Get recent messages
    const messages = await Message.findByChat(chat.id, 50);

    sendSuccess(res, {
      chat,
      messages: messages.reverse(), // Return in chronological order
    });
  });

  /**
   * Create a new chat
   */
  static createChat = asyncHandler(async (req: Request, res: Response) => {
    const { type, name, participants } = req.body;
    const userId = (req as AuthRequest).userId!;

    // Validate chat type
    if (!Object.values(ChatType).includes(type)) {
      throw new BadRequestError('Invalid chat type');
    }

    // Ensure creator is included in participants
    const allParticipants = [...new Set([userId, ...participants])];

    // For direct chats, check if chat already exists
    if (type === ChatType.DIRECT && allParticipants.length === 2) {
      const existingChat = await Chat.findDirectChat(allParticipants[0], allParticipants[1]);
      if (existingChat) {
        throw new ConflictError('Direct chat already exists between these users');
      }
    }

    const chat = new Chat({
      type,
      name: name?.trim(),
      participants: allParticipants,
      lastActivity: new Date(),
      isActive: true,
    });

    await chat.save();
    await chat.populate('participants', 'profile email');

    sendCreated(res, { chat }, 'Chat created successfully');
  });

  /**
   * Send a message to a chat
   */
  static sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { chatId } = req.params;
    const { content, messageType = MessageType.TEXT, replyTo, media } = req.body;
    const userId = req.userId!;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat');
    }

    // Check if user is participant
    if (!chat.isParticipant(userId)) {
      throw new BadRequestError('You are not a participant in this chat');
    }

    // Validate message content
    if (messageType === MessageType.TEXT && (!content || !content.trim())) {
      throw new BadRequestError('Message content is required for text messages');
    }

    const message = new Message({
      sender: userId,
      chat: chatId,
      content: content?.trim(),
      messageType,
      replyTo,
      media,
      timestamp: new Date(),
    });

    await message.save();
    await message.populate('sender', 'profile email');

    if (replyTo) {
      await message.populate('replyTo', 'content sender');
    }

    // Update chat activity (handled by message pre-save middleware)
    chat.updateActivity();
    await chat.save();

    // Emit real-time message via Socket.IO
    const io = (req.app as any).locals.io;
    if (io) {
      io.to(`chat:${chatId}`).emit('new-message', message);
    }

    sendCreated(res, { message }, 'Message sent successfully');
  });

  /**
   * Get messages from a chat with pagination
   */
  static getChatMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { chatId } = req.params;
    const { limit = 50, before } = req.query;
    const userId = req.userId!;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat');
    }

    // Check if user is participant
    if (!chat.isParticipant(userId)) {
      throw new BadRequestError('You are not a participant in this chat');
    }

    const beforeDate = before ? new Date(before as string) : undefined;
    const messages = await Message.findByChat(chatId as string, Number(limit), beforeDate);

    sendSuccess(res, {
      messages: messages.reverse(), // Return in chronological order
      hasMore: messages.length === Number(limit),
    });
  });

  /**
   * Add participants to a group chat
   */
  static addParticipants = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { chatId } = req.params;
    const { participants } = req.body;
    const userId = req.userId!;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat');
    }

    // Check if user is participant
    if (!chat.isParticipant(userId)) {
      throw new BadRequestError('You are not a participant in this chat');
    }

    // Can only add participants to group chats
    if (chat.type === ChatType.DIRECT) {
      throw new BadRequestError('Cannot add participants to direct chat');
    }

    // Add new participants
    for (const participantId of participants) {
      chat.addParticipant(participantId);
    }

    await chat.save();
    await chat.populate('participants', 'profile email');

    // Create system message about new participants
    for (const participantId of participants) {
      if (!chat.participants.map((p) => p.toString()).includes(participantId)) {
        const systemMessage = new Message({
          sender: userId,
          chat: chatId,
          content: `User added to the chat`,
          messageType: MessageType.SYSTEM,
          isSystem: true,
          timestamp: new Date(),
        });
        await systemMessage.save();
      }
    }

    sendSuccess(res, { chat }, 'Participants added successfully');
  });

  /**
   * Remove participants from a group chat
   */
  static removeParticipants = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { chatId } = req.params;
    const { participants } = req.body;
    const userId = req.userId!;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat');
    }

    // Check if user is participant
    if (!chat.isParticipant(userId)) {
      throw new BadRequestError('You are not a participant in this chat');
    }

    // Can only remove participants from group chats
    if (chat.type === ChatType.DIRECT) {
      throw new BadRequestError('Cannot remove participants from direct chat');
    }

    // Remove participants
    for (const participantId of participants) {
      chat.removeParticipant(participantId);
    }

    await chat.save();
    await chat.populate('participants', 'profile email');

    sendSuccess(res, { chat }, 'Participants removed successfully');
  });

  /**
   * Leave a chat
   */
  static leaveChat = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { chatId } = req.params;
    const userId = req.userId!;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat');
    }

    // Check if user is participant
    if (!chat.isParticipant(userId)) {
      throw new BadRequestError('You are not a participant in this chat');
    }

    // Cannot leave direct chats
    if (chat.type === ChatType.DIRECT) {
      throw new BadRequestError('Cannot leave direct chat');
    }

    chat.removeParticipant(userId);
    await chat.save();

    // Create system message about user leaving
    const systemMessage = new Message({
      sender: userId,
      chat: chatId,
      content: `User left the chat`,
      messageType: MessageType.SYSTEM,
      isSystem: true,
      timestamp: new Date(),
    });
    await systemMessage.save();

    sendSuccess(res, null, 'Left chat successfully');
  });

  /**
   * Delete a message (soft delete)
   */
  static deleteMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { messageId } = req.params;
    const userId = req.userId!;

    const message = await Message.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message');
    }

    // Only sender can delete their message
    if (message.sender.toString() !== userId) {
      throw new BadRequestError('You can only delete your own messages');
    }

    // Cannot delete already deleted messages
    if (message.deletedAt) {
      throw new BadRequestError('Message is already deleted');
    }

    message.softDelete();
    await message.save();

    // Emit real-time update via Socket.IO
    const io = (req.app as any).locals.io;
    if (io) {
      io.to(`chat:${message.chat}`).emit('message-deleted', { messageId: message.id });
    }

    sendSuccess(res, null, 'Message deleted successfully');
  });

  /**
   * Edit a message
   */
  static editMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.userId!;

    if (!content || !content.trim()) {
      throw new BadRequestError('Message content is required');
    }

    const message = await Message.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message');
    }

    // Only sender can edit their message
    if (message.sender.toString() !== userId) {
      throw new BadRequestError('You can only edit your own messages');
    }

    // Cannot edit deleted messages
    if (message.deletedAt) {
      throw new BadRequestError('Cannot edit deleted message');
    }

    message.editContent(content.trim());
    await message.save();

    // Emit real-time update via Socket.IO
    const io = (req.app as any).locals.io;
    if (io) {
      io.to(`chat:${message.chat}`).emit('message-edited', message);
    }

    sendSuccess(res, { message }, 'Message edited successfully');
  });

  /**
   * Add reaction to a message
   */
  static addReaction = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.userId!;

    if (!emoji || !emoji.trim()) {
      throw new BadRequestError('Emoji is required');
    }

    const message = await Message.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message');
    }

    // Check if user has access to the chat
    const chat = await Chat.findById(message.chat);
    if (!chat || !chat.isParticipant(userId)) {
      throw new BadRequestError('You do not have access to this chat');
    }

    message.addReaction(emoji.trim(), userId);
    await message.save();

    // Emit real-time update via Socket.IO
    const io = (req.app as any).locals.io;
    if (io) {
      io.to(`chat:${message.chat}`).emit('message-reaction-added', {
        messageId: message.id,
        emoji: emoji.trim(),
        userId,
      });
    }

    sendSuccess(res, { message }, 'Reaction added successfully');
  });

  /**
   * Remove reaction from a message
   */
  static removeReaction = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.userId!;

    if (!emoji || !emoji.trim()) {
      throw new BadRequestError('Emoji is required');
    }

    const message = await Message.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message');
    }

    // Check if user has access to the chat
    const chat = await Chat.findById(message.chat);
    if (!chat || !chat.isParticipant(userId)) {
      throw new BadRequestError('You do not have access to this chat');
    }

    message.removeReaction(emoji.trim(), userId);
    await message.save();

    // Emit real-time update via Socket.IO
    const io = (req.app as any).locals.io;
    if (io) {
      io.to(`chat:${message.chat}`).emit('message-reaction-removed', {
        messageId: message.id,
        emoji: emoji.trim(),
        userId,
      });
    }

    sendSuccess(res, { message }, 'Reaction removed successfully');
  });

  /**
   * Mark chat as read (update user's read status)
   */
  static markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { chatId } = req.params;
    const userId = req.userId!;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat');
    }

    // Check if user is participant
    if (!chat.isParticipant(userId)) {
      throw new BadRequestError('You are not a participant in this chat');
    }

    // In a real implementation, you would track read status per user
    // For now, we'll just return success
    sendSuccess(res, null, 'Chat marked as read');
  });

  /**
   * Get chat statistics
   */
  static getChatStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    const stats = await Chat.aggregate([
      { $match: { participants: userId, isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalChats = await Chat.countDocuments({
      participants: userId,
      isActive: true,
    });

    const totalMessages = await Message.countDocuments({
      sender: userId,
      deletedAt: { $exists: false },
    });

    sendSuccess(res, {
      chatsByType: stats,
      totalChats,
      totalMessagesSent: totalMessages,
    });
  });
}
