import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { EnhancedAuthController } from '../controllers/EnhancedAuthController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  changePasswordValidation,
  updateProfileValidation
} from '../validators';
import { authLimiter } from '../middleware/security';
import passport from '../config/passport';

const router = Router();

// Apply auth rate limiter to all routes
router.use(authLimiter);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
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
 *               - firstName
 *               - lastName
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: SecurePass123
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               username:
 *                 type: string
 *                 example: johndoe
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: User already exists
 */
router.post('/register', registerValidation, validateRequest, AuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
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
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginValidation, validateRequest, AuthController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
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
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', refreshTokenValidation, validateRequest, AuthController.refreshToken);

// Protected routes - require authentication
router.use(authenticate);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', AuthController.logout);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
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
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', AuthController.getProfile);

/**
 * @swagger
 * /auth/profile:
 *   patch:
 *     summary: Update user profile
 *     tags: [Authentication]
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
 *                 example: Tennis enthusiast
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.patch('/profile', updateProfileValidation, validateRequest, AuthController.updateProfile);

/**
 * @swagger
 * /auth/change-password:
 *   patch:
 *     summary: Change user password
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
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Unauthorized or invalid current password
 */
router.patch('/change-password', changePasswordValidation, validateRequest, AuthController.changePassword);

// OAuth/SSO Routes
/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: OAuth successful
 *       401:
 *         description: OAuth failed
 */
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  (req, res) => {
    // Handle successful authentication
    const user = req.user as any;
    if (user) {
      // In a real app, you'd redirect to frontend with tokens
      res.json({ success: true, user: { id: user.id, email: user.email } });
    } else {
      res.status(401).json({ success: false, message: 'OAuth authentication failed' });
    }
  }
);

/**
 * @swagger
 * /auth/github:
 *   get:
 *     summary: Initiate GitHub OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to GitHub OAuth
 */
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

/**
 * @swagger
 * /auth/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: OAuth successful
 */
router.get('/github/callback', 
  passport.authenticate('github', { session: false }),
  (req, res) => {
    const user = req.user as any;
    if (user) {
      res.json({ success: true, user: { id: user.id, email: user.email } });
    } else {
      res.status(401).json({ success: false, message: 'OAuth authentication failed' });
    }
  }
);

/**
 * @swagger
 * /auth/facebook:
 *   get:
 *     summary: Initiate Facebook OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Facebook OAuth
 */
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

/**
 * @swagger
 * /auth/facebook/callback:
 *   get:
 *     summary: Facebook OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: OAuth successful
 */
router.get('/facebook/callback', 
  passport.authenticate('facebook', { session: false }),
  (req, res) => {
    const user = req.user as any;
    if (user) {
      res.json({ success: true, user: { id: user.id, email: user.email } });
    } else {
      res.status(401).json({ success: false, message: 'OAuth authentication failed' });
    }
  }
);

// Enhanced Security Routes
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
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
 *     responses:
 *       200:
 *         description: Reset email sent
 */
router.post('/forgot-password', EnhancedAuthController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/reset-password', EnhancedAuthController.resetPassword);

/**
 * @swagger
 * /auth/verify-mfa:
 *   post:
 *     summary: Verify MFA during login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *               token:
 *                 type: string
 *               backupCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: MFA verification successful
 */
router.post('/verify-mfa', EnhancedAuthController.verifyMFALogin);

// Protected routes requiring authentication
router.use(authenticate);

// MFA Management Routes
/**
 * @swagger
 * /auth/mfa/setup:
 *   post:
 *     summary: Setup MFA for account
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA setup initiated
 */
router.post('/mfa/setup', EnhancedAuthController.setupMFA);

/**
 * @swagger
 * /auth/mfa/verify:
 *   post:
 *     summary: Verify and enable MFA
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
 *               - secret
 *               - token
 *             properties:
 *               secret:
 *                 type: string
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: MFA enabled successfully
 */
router.post('/mfa/verify', EnhancedAuthController.verifyMFA);

/**
 * @swagger
 * /auth/mfa/disable:
 *   post:
 *     summary: Disable MFA for account
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
 *               - password
 *               - token
 *             properties:
 *               password:
 *                 type: string
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: MFA disabled successfully
 */
router.post('/mfa/disable', EnhancedAuthController.disableMFA);

// Security Settings Routes
/**
 * @swagger
 * /auth/security:
 *   get:
 *     summary: Get security settings
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security settings retrieved
 */
router.get('/security', EnhancedAuthController.getSecuritySettings);

/**
 * @swagger
 * /auth/security:
 *   patch:
 *     summary: Update security settings
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               allowedIPs:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Security settings updated
 */
router.patch('/security', EnhancedAuthController.updateSecuritySettings);

// Social Login Management Routes
/**
 * @swagger
 * /auth/social/link:
 *   post:
 *     summary: Link social account
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
 *               - provider
 *               - providerId
 *             properties:
 *               provider:
 *                 type: string
 *               providerId:
 *                 type: string
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Social account linked
 */
router.post('/social/link', EnhancedAuthController.linkSocialAccount);

/**
 * @swagger
 * /auth/social/unlink:
 *   post:
 *     summary: Unlink social account
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
 *               - provider
 *             properties:
 *               provider:
 *                 type: string
 *     responses:
 *       200:
 *         description: Social account unlinked
 */
router.post('/social/unlink', EnhancedAuthController.unlinkSocialAccount);

// Email Verification Routes
/**
 * @swagger
 * /auth/send-verification:
 *   post:
 *     summary: Send email verification to current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification email sent
 *       409:
 *         description: Email already verified
 */
router.post('/send-verification', EnhancedAuthController.sendEmailVerification);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       401:
 *         description: Invalid or expired token
 */
router.post('/verify-email', EnhancedAuthController.verifyEmail);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend email verification
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
 *     responses:
 *       200:
 *         description: Verification email sent if account exists
 */
router.post('/resend-verification', EnhancedAuthController.resendEmailVerification);

/**
 * @swagger
 * /auth/deactivate:
 *   patch:
 *     summary: Deactivate user account
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 *       401:
 *         description: Unauthorized
 */
router.patch('/deactivate', AuthController.deactivateAccount);

export default router;