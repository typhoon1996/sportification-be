import { Chat } from "../../domain/models/Chat";
import { Message } from "../../domain/models/Message";
import { ChatEventPublisher } from "../../events/publishers/ChatEventPublisher";
import { NotFoundError } from "../../../../shared/middleware/errorHandler";

export class ChatService {
  private eventPublisher: ChatEventPublisher;

  constructor() {
    this.eventPublisher = new ChatEventPublisher();
  }

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

  async getUserChats(userId: string) {
    const chats = await Chat.find({ participants: userId })
      .populate("participants", "profile")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    return chats;
  }
}
