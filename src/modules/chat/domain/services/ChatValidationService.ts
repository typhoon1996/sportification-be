import {ValidationError} from "../../../../shared/middleware/errorHandler";
import {IChat} from "../../../../shared/types";
import {IChatValidationService, IChatCreationData} from "../interfaces";

/**
 * ChatValidationService - Handles chat business rule validation (SRP)
 *
 * Single Responsibility: Validates chat operations against business rules.
 * Separated from ChatService to follow Single Responsibility Principle.
 *
 * Features:
 * - Participant access validation
 * - Chat creation data validation
 * - Message content validation
 *
 * SOLID Principles Applied:
 * - SRP: Only handles validation, no data modification or event publishing
 * - OCP: Can be extended with new validation rules
 * - DIP: Works with Chat interface/model
 *
 * @example
 * const validationService = new ChatValidationService();
 * validationService.validateParticipant(chat, userId); // Throws if invalid
 */
export class ChatValidationService implements IChatValidationService {
  /**
   * Validate user is participant in chat
   *
   * Verifies that the user has access to view/send messages in the chat.
   *
   * @param chat - Chat to validate participant access
   * @param userId - User ID to check for participation
   * @throws {ValidationError} If user is not a participant
   */
  validateParticipant(chat: IChat, userId: string): void {
    if (!chat.participants.some((p: any) => p.toString() === userId)) {
      throw new ValidationError("User not authorized to access this chat");
    }
  }

  /**
   * Validate chat creation data
   *
   * Ensures chat creation data meets business requirements:
   * - At least 2 participants total (creator + others)
   * - Direct chats have exactly 2 participants
   * - Group chats have 2 or more participants
   *
   * @param data - Chat creation data to validate
   * @throws {ValidationError} If creation data is invalid
   */
  validateChatCreation(data: IChatCreationData): void {
    const totalParticipants = 1 + data.participantIds.length; // creator + others

    if (totalParticipants < 2) {
      throw new ValidationError("Chat must have at least 2 participants");
    }

    if (data.type === "direct" && totalParticipants !== 2) {
      throw new ValidationError("Direct chat must have exactly 2 participants");
    }

    if (data.participantIds.length === 0) {
      throw new ValidationError("Must specify at least one participant");
    }

    // Check for duplicate participants
    const uniqueParticipants = new Set(data.participantIds);
    if (uniqueParticipants.size !== data.participantIds.length) {
      throw new ValidationError("Duplicate participants not allowed");
    }

    // Check if creator is in participant list (should not be)
    if (data.participantIds.includes(data.creatorId)) {
      throw new ValidationError(
        "Creator is automatically added as participant"
      );
    }
  }

  /**
   * Validate message content
   *
   * Ensures message content meets requirements:
   * - Not empty or whitespace only
   * - Within acceptable length limits
   *
   * @param content - Message content to validate
   * @throws {ValidationError} If content is invalid
   */
  validateMessageContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new ValidationError("Message content cannot be empty");
    }

    if (content.length > 5000) {
      throw new ValidationError(
        "Message content cannot exceed 5000 characters"
      );
    }
  }
}
