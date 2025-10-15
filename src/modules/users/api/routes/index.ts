import {Router} from "express";
import {userController} from "../controllers/UserController";
import {authenticate, authorize} from "../../../../shared/middleware/auth";
import {validateRequest} from "../../../../shared/middleware/validation";
import {updateProfileValidation} from "../../../../shared/validators";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (Admin/Moderator only)
 *     description: Retrieve a paginated list of all users in the system
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of users per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin, moderator]
 *         description: Filter by user role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Users retrieved successfully
 *               data:
 *                 users:
 *                   - id: 507f1f77bcf86cd799439011
 *                     email: user1@example.com
 *                     role: user
 *                     isActive: true
 *                     profile:
 *                       firstName: John
 *                       lastName: Doe
 *               meta:
 *                 pagination:
 *                   page: 1
 *                   limit: 10
 *                   total: 100
 *                   pages: 10
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/", authorize(["admin", "moderator"]), userController.getUsers);

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Search users
 *     description: Search for users by name, email, or other criteria
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (name, email, etc.)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Search completed successfully
 *               data:
 *                 users:
 *                   - id: 507f1f77bcf86cd799439011
 *                     email: john.doe@example.com
 *                     profile:
 *                       firstName: John
 *                       lastName: Doe
 *               meta:
 *                 pagination:
 *                   page: 1
 *                   limit: 10
 *                   total: 5
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/search", userController.searchUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve detailed information about a specific user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: User retrieved successfully
 *               data:
 *                 user:
 *                   id: 507f1f77bcf86cd799439011
 *                   email: user@example.com
 *                   role: user
 *                   profile:
 *                     firstName: John
 *                     lastName: Doe
 *                     bio: Sports enthusiast
 *                   stats:
 *                     matchesPlayed: 25
 *                     tournamentsWon: 3
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id", userController.getUserById);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update own profile
 *     description: Update the profile information of the authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *                 example: Passionate football player
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: 1990-01-15
 *               phoneNumber:
 *                 type: string
 *                 example: +1234567890
 *               location:
 *                 type: object
 *                 properties:
 *                   city:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Profile updated successfully
 *               data:
 *                 profile:
 *                   firstName: John
 *                   lastName: Doe
 *                   bio: Passionate football player
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put(
  "/profile",
  updateProfileValidation,
  validateRequest,
  userController.updateProfile
);

/**
 * @swagger
 * /users/{id}/friends:
 *   get:
 *     summary: Get user's friends
 *     description: Retrieve the list of friends for a specific user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Friends retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Friends retrieved successfully
 *               data:
 *                 friends:
 *                   - id: 507f1f77bcf86cd799439012
 *                     profile:
 *                       firstName: Jane
 *                       lastName: Smith
 *                   - id: 507f1f77bcf86cd799439013
 *                     profile:
 *                       firstName: Bob
 *                       lastName: Johnson
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id/friends", userController.getUserFriends);

/**
 * @swagger
 * /users/{friendId}/friend:
 *   post:
 *     summary: Add friend
 *     description: Send a friend request or add a user as a friend
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to add as friend
 *     responses:
 *       200:
 *         description: Friend added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Friend added successfully
 *               data: null
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post("/:friendId/friend", userController.addFriend);

/**
 * @swagger
 * /users/{friendId}/friend:
 *   delete:
 *     summary: Remove friend
 *     description: Remove a user from your friends list
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the friend to remove
 *     responses:
 *       200:
 *         description: Friend removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Friend removed successfully
 *               data: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete("/:friendId/friend", userController.removeFriend);

export default router;
