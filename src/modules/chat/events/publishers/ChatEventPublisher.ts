import { eventBus } from "../../../../shared/events/EventBus";

export const ChatCreatedEvent = "chat.chat.created";
export const MessageSentEvent = "chat.message.sent";

export class ChatEventPublisher {
  publishChatCreated(payload: {
    chatId: string;
    participants: string[];
    type: string;
  }): void {
    eventBus.publish({
      eventType: ChatCreatedEvent,
      aggregateId: payload.chatId,
      aggregateType: "Chat",
      timestamp: new Date(),
      payload,
    });
  }

  publishMessageSent(payload: {
    messageId: string;
    chatId: string;
    senderId: string;
    content: string;
    recipientIds: string[];
  }): void {
    eventBus.publish({
      eventType: MessageSentEvent,
      aggregateId: payload.messageId,
      aggregateType: "Message",
      timestamp: new Date(),
      payload,
    });
  }
}
