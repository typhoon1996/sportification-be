import { Router } from "express";
import { userController } from "../controllers/UserController";
import { authenticate } from "../../../../shared/middleware/auth";
import { validateRequest } from "../../../../shared/middleware/validation";
import { updateProfileValidation } from "../../../../shared/validators";

const router = Router();

// Public routes
router.get("/", userController.getUsers);
router.get("/search", userController.searchUsers);
router.get("/:id", userController.getUserById);

// Protected routes
router.put(
  "/profile",
  authenticate,
  updateProfileValidation,
  validateRequest,
  userController.updateProfile
);

router.get("/:id/friends", authenticate, userController.getUserFriends);
router.post("/:friendId/friend", authenticate, userController.addFriend);
router.delete("/:friendId/friend", authenticate, userController.removeFriend);

export default router;
