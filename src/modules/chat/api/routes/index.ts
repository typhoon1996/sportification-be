import { Router } from "express";
import { chatController } from "../controllers/ChatController";
import { authenticate } from "../../../../shared/middleware/auth";

const router = Router();

// Chat routes
router.post("/", authenticate, chatController.createChat);
router.get("/", authenticate, chatController.getUserChats);
router.get("/:chatId/messages", authenticate, chatController.getMessages);
router.post("/:chatId/messages", authenticate, chatController.sendMessage);

export default router;
