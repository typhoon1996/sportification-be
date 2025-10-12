import { Response } from 'express';
import { ChatService } from '../../domain/services/ChatService';
import { sendSuccess, sendCreated, asyncHandler } from '../../../../shared/middleware/errorHandler';
import { AuthRequest } from '../../../../shared/middleware/auth';
import logger from '../../../../shared/infrastructure/logging';

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  private getUserId(req: AuthRequest): string {
    if (!req.userId) {
      throw new Error('User not authenticated');
    }
    return req.userId;
  }

  createChat = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { participantIds, type } = req.body;
    const userId = this.getUserId(req);

    const chat = await this.chatService.createChat(userId, participantIds, type);

    await chat.populate('participants', 'profile');

    logger.info(`Chat created by user: ${userId}`, { chatId: chat.id });

    sendCreated(res, { chat }, 'Chat created successfully');
  });

  getUserChats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const chats = await this.chatService.getUserChats(userId);

    sendSuccess(res, { chats });
  });

  getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const userId = this.getUserId(req);

    const messages = await this.chatService.getMessages(req.params.chatId as string, userId, limit);

    sendSuccess(res, { messages });
  });

  sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { content } = req.body;
    const userId = this.getUserId(req);

    const message = await this.chatService.sendMessage(
      req.params.chatId as string,
      userId,
      content
    );

    await message.populate('sender', 'profile');

    logger.info(`Message sent by user: ${userId}`, {
      chatId: req.params.chatId,
      messageId: message.id,
    });

    sendCreated(res, { message }, 'Message sent successfully');
  });
}

export const chatController = new ChatController();
