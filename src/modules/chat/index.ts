/**
 * Chat Module Public API
 */

export { chatModule } from "./module";
export { ChatService } from "./domain/services/ChatService";
export {
  ChatCreatedEvent,
  MessageSentEvent,
} from "./events/publishers/ChatEventPublisher";
