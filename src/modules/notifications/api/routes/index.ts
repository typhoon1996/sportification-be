/**
 * Notification Routes Module
 *
 * Base Path: /api/v1/notifications
 *
 * Manages user notifications for various system events.
 * Supports notification delivery, read status management, and subscription preferences.
 *
 * Notification Types:
 * - System notifications (announcements, updates)
 * - Match notifications (invites, reminders, results)
 * - Friend notifications (friend requests, activity)
 * - Tournament notifications (registration, bracket updates)
 * - Team notifications (invites, updates)
 * - Chat notifications (new messages, mentions)
 *
 * Features:
 * - Notification retrieval with pagination
 * - Read/unread filtering
 * - Individual and bulk read marking
 * - Unread count endpoint
 * - Real-time push notification support
 *
 * Security:
 * - All routes require authentication
 * - Users can only access their own notifications
 */

import {Router} from "express";
import {authenticate} from "../../../../shared/middleware/auth";
import {notificationController} from "../controllers/NotificationController";

const router = Router();

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user notifications
 *     description: Retrieve notifications for the authenticated user
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Filter to show only unread notifications
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
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
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", authenticate, notificationController.getNotifications);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   get:
 *     summary: Get notification by ID
 *     description: Retrieve a specific notification
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification retrieved successfully
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
 *                     notification:
 *                       $ref: '#/components/schemas/Notification'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id", authenticate, notificationController.getNotificationById);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Notification marked as read"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put("/:id/read", authenticate, notificationController.markAsRead);

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     description: Mark all user notifications as read
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "All notifications marked as read"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put("/read-all", authenticate, notificationController.markAllAsRead);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     description: Delete a specific notification
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Notification deleted successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete("/:id", authenticate, notificationController.deleteNotification);

export default router;
