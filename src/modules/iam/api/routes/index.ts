import {Router} from "express";
import {authController} from "../controllers/AuthController";
import {authenticate} from "../../../../shared/middleware/auth";
import {validateRequest} from "../../../../shared/middleware/validation";
import {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  changePasswordValidation,
} from "../../../../shared/validators";
import {authLimiter} from "../../../../shared/middleware/security";

/**
 * Authentication Routes
 *
 * This module defines all authentication-related API endpoints including:
 * - User registration and login
 * - Token management (refresh, logout)
 * - Profile management
 * - Password operations
 *
 * Security Features:
 * - Rate limiting applied to all routes (20 requests per 15 minutes)
 * - Request validation using express-validator
 * - JWT authentication for protected routes
 *
 * Base Path: /api/v1/auth
 *
 * Public Routes (no authentication required):
 * - POST /register - Create new user account
 * - POST /login - Authenticate and receive tokens
 * - POST /refresh-token - Get new access token
 *
 * Protected Routes (authentication required):
 * - POST /logout - Invalidate refresh token
 * - GET /profile - Get authenticated user's profile
 * - PUT /change-password - Update user password
 * - DELETE /deactivate - Deactivate user account
 */

const router = Router();

/**
 * Apply rate limiting middleware to all authentication routes
 * Protects against brute force attacks and abuse
 * Limit: 20 requests per 15 minutes per IP address
 */
router.use(authLimiter);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - profile
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123!
 *               profile:
 *                 type: object
 *                 required:
 *                   - firstName
 *                   - lastName
 *                 properties:
 *                   firstName:
 *                     type: string
 *                     example: John
 *                   lastName:
 *                     type: string
 *                     example: Doe
 *                   dateOfBirth:
 *                     type: string
 *                     format: date
 *                     example: 1990-01-15
 *                   phoneNumber:
 *                     type: string
 *                     example: +1234567890
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Registration successful
 *               data:
 *                 user:
 *                   id: 507f1f77bcf86cd799439011
 *                   email: user@example.com
 *                   profile:
 *                     firstName: John
 *                     lastName: Doe
 *                 accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       429:
 *         description: Too many requests - rate limit exceeded
 */
/**
 * POST /auth/register
 *
 * Register a new user account
 *
 * Middleware Chain:
 * 1. authLimiter - Rate limiting (applied to all routes in this router)
 * 2. registerValidation - Validates email format, password strength, required fields
 * 3. validateRequest - Checks validation results and returns errors if any
 * 4. authController.register - Handles registration logic
 *
 * No authentication required (public endpoint)
 */
router.post(
  "/register",
  registerValidation,
  validateRequest,
  authController.register
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password, returns access and refresh tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Login successful
 *               data:
 *                 user:
 *                   id: 507f1f77bcf86cd799439011
 *                   email: user@example.com
 *                   role: user
 *                   profile:
 *                     firstName: John
 *                     lastName: Doe
 *                 accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 expiresIn: 604800
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         description: Too many requests - rate limit exceeded
 */
router.post("/login", loginValidation, validateRequest, authController.login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Generate a new access token using a valid refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Token refreshed successfully
 *               data:
 *                 accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 expiresIn: 604800
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         description: Too many requests - rate limit exceeded
 */
router.post(
  "/refresh-token",
  refreshTokenValidation,
  validateRequest,
  authController.refreshToken
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     description: Invalidate the current refresh token and log out the user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Logout successful
 *               data: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
/**
 * POST /auth/logout
 *
 * Logout user and invalidate refresh token
 *
 * Middleware Chain:
 * 1. authLimiter - Rate limiting (applied to all routes in this router)
 * 2. authenticate - Verifies JWT access token and attaches user to request
 * 3. authController.logout - Invalidates refresh token
 *
 * Requires authentication
 */
router.post("/logout", authenticate, authController.logout);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get authenticated user profile
 *     description: Retrieve the profile information of the currently authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Profile retrieved successfully
 *               data:
 *                 user:
 *                   id: 507f1f77bcf86cd799439011
 *                   email: user@example.com
 *                   role: user
 *                   isActive: true
 *                   profile:
 *                     firstName: John
 *                     lastName: Doe
 *                     dateOfBirth: 1990-01-15
 *                     phoneNumber: +1234567890
 *                   createdAt: 2025-01-01T00:00:00.000Z
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/profile", authenticate, authController.getProfile);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change user password
 *     description: Change the password for the currently authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: OldPass123!
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: NewPass123!
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Password changed successfully
 *               data: null
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put(
  "/change-password",
  authenticate,
  changePasswordValidation,
  validateRequest,
  authController.changePassword
);

/**
 * @swagger
 * /auth/deactivate:
 *   delete:
 *     summary: Deactivate user account
 *     description: Deactivate the currently authenticated user's account
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Account deactivated successfully
 *               data: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete("/deactivate", authenticate, authController.deactivateAccount);

export default router;
