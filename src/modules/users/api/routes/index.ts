import {Router} from "express";
import {userController} from "../controllers/UserController";
import {authenticate, authorize} from "../../../../shared/middleware/auth";
import {validateRequest} from "../../../../shared/middleware/validation";
import {updateProfileValidation} from "../../../../shared/validators";

const router = Router();

// All routes require authentication
router.use(authenticate);

// User listing routes - admin/moderator only
router.get("/", authorize(["admin", "moderator"]), userController.getUsers);
router.get("/search", userController.searchUsers); // Any authenticated user can search

// Get user by ID - any authenticated user
router.get("/:id", userController.getUserById);

// Profile management - own profile only
router.put(
  "/profile",
  updateProfileValidation,
  validateRequest,
  userController.updateProfile
);

// Friend management - any authenticated user
router.get("/:id/friends", userController.getUserFriends);
router.post("/:friendId/friend", userController.addFriend);
router.delete("/:friendId/friend", userController.removeFriend);

export default router;
