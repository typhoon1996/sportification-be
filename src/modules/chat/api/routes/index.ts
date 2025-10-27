/**
 * Chat Routes Module
 *
 * Base Path: /api/v1/chats
 *
 * Handles real-time messaging and chat room management.
 * Supports both direct messaging (1-on-1) and group chats.
 *
 * Features:
 * - Chat creation (direct and group)
 * - Message sending and retrieval
 * - Chat history with pagination
 * - Real-time WebSocket integration
 * - Participant management
 *
 * Security:
 * - All routes require authentication
 * - Users can only access chats they're participants in
 * - Message authorization enforced at service layer
 */

import {Router} from "express";
import {authenticate} from "../../../../shared/middleware/auth";
import {chatController} from "../controllers/ChatController";

const router = Router();

/**
 * @swagger
 * /api/v1/chats:
 *   post:
 *     summary: Create a chat
 *     description: Create a new chat (direct message or group chat)
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
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
 *                 description: Array of user IDs
 *                 example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *               type:
 *                 type: string
 *                 enum: [direct, group]
 *                 description: Chat type
 *                 example: "direct"
 *               name:
 *                 type: string
 *                 description: Group chat name (required for group chats)
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     chat:
 *                       $ref: '#/components/schemas/Chat'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/", authenticate, chatController.createChat);

/**
 * @swagger
 * /api/v1/chats:
 *   get:
 *     summary: Get user's chats
 *     description: Retrieve all chats for the authenticated user
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", authenticate, chatController.getUserChats);

/**
 * @swagger
 * /api/v1/chats/{chatId}/messages:
 *   get:
 *     summary: Get chat messages
 *     description: Retrieve messages from a specific chat
 *     tags:
 *       - Chat
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
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:chatId/messages", authenticate, chatController.getMessages);

/**
 * @swagger
 * /api/v1/chats/{chatId}/messages:
 *   post:
 *     summary: Send a message
 *     description: Send a message in a chat
 *     tags:
 *       - Chat
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
 *                 example: "Hello team!"
 *               type:
 *                 type: string
 *                 enum: [text, image, file]
 *                 default: text
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
router.post("/:chatId/messages", authenticate, chatController.sendMessage);

export default router;
