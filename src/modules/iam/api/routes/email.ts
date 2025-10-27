import {Router} from "express";
import {body, param} from "express-validator";
import {authLimiter} from "../../../../shared/middleware/security";
import {validateRequest} from "../../../../shared/middleware/validation";
import {emailController} from "../controllers/EmailController";

const router = Router();

// Apply rate limiting
router.use(authLimiter);

/**
 * @swagger
 * /auth/verify-email/{token}:
 *   post:
 *     summary: Verify email address
 *     description: Verify user email with verification token
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  "/verify-email/:token",
  [param("token").notEmpty().withMessage("Token is required")],
  validateRequest,
  emailController.verifyEmail
);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     description: Resend email verification link
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Verification email sent
 *       400:
 *         description: Email already verified
 *       404:
 *         description: User not found
 */
router.post(
  "/resend-verification",
  [body("email").isEmail().withMessage("Valid email is required")],
  validateRequest,
  emailController.resendVerification
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Request a password reset link via email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Reset link sent if email exists
 */
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Valid email is required")],
  validateRequest,
  emailController.forgotPassword
);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset password
 *     description: Reset password using reset token
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 example: NewSecurePass123!
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  "/reset-password/:token",
  [
    param("token").notEmpty().withMessage("Token is required"),
    body("password")
      .isLength({min: 8})
      .withMessage("Password must be at least 8 characters"),
  ],
  validateRequest,
  emailController.resetPassword
);

/**
 * @swagger
 * /auth/validate-reset-token/{token}:
 *   get:
 *     summary: Validate reset token
 *     description: Check if password reset token is valid
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token
 *     responses:
 *       200:
 *         description: Token validity status
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
 *                     valid:
 *                       type: boolean
 */
router.get(
  "/validate-reset-token/:token",
  [param("token").notEmpty().withMessage("Token is required")],
  validateRequest,
  emailController.validateResetToken
);

export default router;
