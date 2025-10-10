import { Router } from "express";
import { notificationController } from "../controllers/NotificationController";
import { authenticate } from "../../../../shared/middleware/auth";

const router = Router();

// Notification routes
router.get("/", authenticate, notificationController.getNotifications);
router.get("/:id", authenticate, notificationController.getNotificationById);
router.put("/:id/read", authenticate, notificationController.markAsRead);
router.put("/read-all", authenticate, notificationController.markAllAsRead);
router.delete("/:id", authenticate, notificationController.deleteNotification);

export default router;
