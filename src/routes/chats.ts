import express from 'express';
import { ChatController } from '../controllers/ChatController';
import { authenticate } from '../middleware/auth';
import { validationResult } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Validation schemas
const createChatValidation = [
  body('type')
    .isIn(['direct', 'group', 'match', 'tournament'])
    .withMessage('Chat type must be direct, group, match, or tournament'),
  
  body('participants')
    .isArray({ min: 1 })
    .withMessage('Participants must be an array with at least one participant'),
  
  body('participants.*')
    .isMongoId()
    .withMessage('Each participant must be a valid user ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Chat name must be between 1 and 100 characters')
];

const sendMessageValidation = [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  
  body('messageType')
    .optional()
    .isIn(['text', 'media', 'system', 'file'])
    .withMessage('Message type must be text, media, system, or file'),
  
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Reply to must be a valid message ID')
];

const chatIdValidation = [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID')
];

const messageIdValidation = [
  param('messageId')
    .isMongoId()
    .withMessage('Invalid message ID')
];

const addParticipantsValidation = [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID'),
  
  body('participants')
    .isArray({ min: 1 })
    .withMessage('Participants must be an array with at least one participant'),
  
  body('participants.*')
    .isMongoId()
    .withMessage('Each participant must be a valid user ID')
];

const editMessageValidation = [
  param('messageId')
    .isMongoId()
    .withMessage('Invalid message ID'),
  
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters')
];

const reactionValidation = [
  param('messageId')
    .isMongoId()
    .withMessage('Invalid message ID'),
  
  body('emoji')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Emoji must be between 1 and 10 characters')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('type')
    .optional()
    .isIn(['direct', 'group', 'match', 'tournament'])
    .withMessage('Type must be direct, group, match, or tournament')
];

const messagesQueryValidation = [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('before')
    .optional()
    .isISO8601()
    .withMessage('Before must be a valid date')
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Chat:
 *       type: object
 *       required:
 *         - type
 *         - participants
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the chat
 *         type:
 *           type: string
 *           enum: [direct, group, match, tournament]
 *           description: Type of chat
 *         name:
 *           type: string
 *           description: Name of the chat (required for group chats)
 *         participants:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who are participants
 *         lastMessage:
 *           $ref: '#/components/schemas/Message'
 *         lastActivity:
 *           type: string
 *           format: date-time
 *           description: Last activity timestamp
 *         isActive:
 *           type: boolean
 *           description: Whether the chat is active
 *     
 *     Message:
 *       type: object
 *       required:
 *         - sender
 *         - chat
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the message
 *         sender:
 *           type: string
 *           description: User ID who sent the message
 *         chat:
 *           type: string
 *           description: Chat ID where the message belongs
 *         content:
 *           type: string
 *           description: Message content
 *         messageType:
 *           type: string
 *           enum: [text, media, system, file]
 *           description: Type of message
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the message was sent
 *         editedAt:
 *           type: string
 *           format: date-time
 *           description: When the message was last edited
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           description: When the message was deleted
 *         replyTo:
 *           type: string
 *           description: Message ID this message is replying to
 */

/**
 * @swagger
 * tags:
 *   name: Chats
 *   description: Chat management and messaging
 */

/**
 * @swagger
 * /api/v1/chats:
 *   get:
 *     summary: Get user's chats
 *     description: Retrieve all chats where the authenticated user is a participant
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of chats per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [direct, group, match, tournament]
 *         description: Filter by chat type
 *     responses:
 *       200:
 *         description: Chats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     chats:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Chat'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authenticate, paginationValidation, validationResult, ChatController.getChats);

/**
 * @swagger
 * /api/v1/chats:
 *   post:
 *     summary: Create a new chat
 *     description: Create a new direct or group chat
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - participants
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [direct, group, match, tournament]
 *                 description: Type of chat to create
 *               name:
 *                 type: string
 *                 description: Name for the chat (required for group chats)
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to include in the chat
 *     responses:
 *       201:
 *         description: Chat created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     chat:
 *                       $ref: '#/components/schemas/Chat'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post('/', authenticate, createChatValidation, validationResult, ChatController.createChat);

/**
 * @swagger
 * /api/v1/chats/{chatId}:
 *   get:
 *     summary: Get chat by ID
 *     description: Get a specific chat and its recent messages
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Chat retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     chat:
 *                       $ref: '#/components/schemas/Chat'
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:chatId', authenticate, chatIdValidation, validationResult, ChatController.getChatById);

/**
 * @swagger
 * /api/v1/chats/{chatId}/messages:
 *   get:
 *     summary: Get chat messages
 *     description: Get messages from a specific chat with pagination
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of messages to retrieve
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Get messages before this timestamp
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *                     hasMore:
 *                       type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:chatId/messages', authenticate, messagesQueryValidation, validationResult, ChatController.getChatMessages);

/**
 * @swagger
 * /api/v1/chats/{chatId}/messages:
 *   post:
 *     summary: Send a message
 *     description: Send a message to a specific chat
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message content
 *               messageType:
 *                 type: string
 *                 enum: [text, media, system, file]
 *                 description: Type of message
 *               replyTo:
 *                 type: string
 *                 description: Message ID this message is replying to
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       $ref: '#/components/schemas/Message'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:chatId/messages', authenticate, sendMessageValidation, validationResult, ChatController.sendMessage);

/**
 * @swagger
 * /api/v1/chats/{chatId}/participants:
 *   post:
 *     summary: Add participants to chat
 *     description: Add new participants to a group chat
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participants
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to add
 *     responses:
 *       200:
 *         description: Participants added successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:chatId/participants', authenticate, addParticipantsValidation, validationResult, ChatController.addParticipants);

/**
 * @swagger
 * /api/v1/chats/{chatId}/participants:
 *   delete:
 *     summary: Remove participants from chat
 *     description: Remove participants from a group chat
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participants
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to remove
 *     responses:
 *       200:
 *         description: Participants removed successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:chatId/participants', authenticate, addParticipantsValidation, validationResult, ChatController.removeParticipants);

/**
 * @swagger
 * /api/v1/chats/{chatId}/leave:
 *   post:
 *     summary: Leave a chat
 *     description: Leave a group chat
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Left chat successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:chatId/leave', authenticate, chatIdValidation, validationResult, ChatController.leaveChat);

/**
 * @swagger
 * /api/v1/chats/{chatId}/read:
 *   post:
 *     summary: Mark chat as read
 *     description: Mark all messages in a chat as read
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Chat marked as read
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:chatId/read', authenticate, chatIdValidation, validationResult, ChatController.markAsRead);

/**
 * @swagger
 * /api/v1/chats/messages/{messageId}:
 *   delete:
 *     summary: Delete a message
 *     description: Delete (soft delete) a message
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/messages/:messageId', authenticate, messageIdValidation, validationResult, ChatController.deleteMessage);

/**
 * @swagger
 * /api/v1/chats/messages/{messageId}:
 *   put:
 *     summary: Edit a message
 *     description: Edit the content of a message
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: New message content
 *     responses:
 *       200:
 *         description: Message edited successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/messages/:messageId', authenticate, editMessageValidation, validationResult, ChatController.editMessage);

/**
 * @swagger
 * /api/v1/chats/messages/{messageId}/reactions:
 *   post:
 *     summary: Add reaction to message
 *     description: Add an emoji reaction to a message
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emoji
 *             properties:
 *               emoji:
 *                 type: string
 *                 description: Emoji to add as reaction
 *     responses:
 *       200:
 *         description: Reaction added successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/messages/:messageId/reactions', authenticate, reactionValidation, validationResult, ChatController.addReaction);

/**
 * @swagger
 * /api/v1/chats/messages/{messageId}/reactions:
 *   delete:
 *     summary: Remove reaction from message
 *     description: Remove an emoji reaction from a message
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emoji
 *             properties:
 *               emoji:
 *                 type: string
 *                 description: Emoji to remove from reactions
 *     responses:
 *       200:
 *         description: Reaction removed successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/messages/:messageId/reactions', authenticate, reactionValidation, validationResult, ChatController.removeReaction);

/**
 * @swagger
 * /api/v1/chats/stats:
 *   get:
 *     summary: Get chat statistics
 *     description: Get user's chat statistics
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     chatsByType:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: number
 *                     totalChats:
 *                       type: number
 *                     totalMessagesSent:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/stats', authenticate, ChatController.getChatStats);

export default router;