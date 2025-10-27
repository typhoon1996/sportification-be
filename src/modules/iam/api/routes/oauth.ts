import {Router} from "express";
import {body, param} from "express-validator";
import {authenticate} from "../../../../shared/middleware/auth";
import {authLimiter} from "../../../../shared/middleware/security";
import {validateRequest} from "../../../../shared/middleware/validation";
import {oauthController} from "../controllers/OAuthController";

const router = Router();

// Apply auth limiter
router.use(authLimiter);

/**
 * @swagger
 * /oauth/google:
 *   get:
 *     summary: Initiate Google OAuth
 *     description: Redirects to Google OAuth consent screen
 *     tags: [OAuth]
 *     responses:
 *       302:
 *         description: Redirects to Google OAuth
 */
router.get("/google", oauthController.googleAuth);

/**
 * @swagger
 * /oauth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     description: Handles Google OAuth callback and completes authentication
 *     tags: [OAuth]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     tokens:
 *                       $ref: '#/components/schemas/AuthTokens'
 *                     isNewUser:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Authentication failed
 */
router.get("/google/callback", ...oauthController.googleCallback);

/**
 * @swagger
 * /oauth/facebook:
 *   get:
 *     summary: Initiate Facebook OAuth
 *     description: Redirects to Facebook OAuth consent screen
 *     tags: [OAuth]
 *     responses:
 *       302:
 *         description: Redirects to Facebook OAuth
 */
router.get("/facebook", oauthController.facebookAuth);

/**
 * @swagger
 * /oauth/facebook/callback:
 *   get:
 *     summary: Facebook OAuth callback
 *     description: Handles Facebook OAuth callback and completes authentication
 *     tags: [OAuth]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from Facebook
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Authentication failed
 */
router.get("/facebook/callback", ...oauthController.facebookCallback);

/**
 * @swagger
 * /oauth/github:
 *   get:
 *     summary: Initiate GitHub OAuth
 *     description: Redirects to GitHub OAuth consent screen
 *     tags: [OAuth]
 *     responses:
 *       302:
 *         description: Redirects to GitHub OAuth
 */
router.get("/github", oauthController.githubAuth);

/**
 * @swagger
 * /oauth/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     description: Handles GitHub OAuth callback and completes authentication
 *     tags: [OAuth]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from GitHub
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Authentication failed
 */
router.get("/github/callback", ...oauthController.githubCallback);

/**
 * @swagger
 * /oauth/link:
 *   post:
 *     summary: Link social account
 *     description: Link a social login account to the authenticated user
 *     tags: [OAuth]
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
 *               - email
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [google, facebook, github]
 *                 example: google
 *               providerId:
 *                 type: string
 *                 example: "1234567890"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Account linked successfully
 *       400:
 *         description: Account already linked
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  "/link",
  authenticate,
  [
    body("provider")
      .isIn(["google", "facebook", "github"])
      .withMessage("Invalid provider"),
    body("providerId").notEmpty().withMessage("Provider ID is required"),
    body("email").isEmail().withMessage("Valid email is required"),
  ],
  validateRequest,
  oauthController.linkAccount
);

/**
 * @swagger
 * /oauth/unlink/{provider}:
 *   delete:
 *     summary: Unlink social account
 *     description: Remove a linked social login account
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, facebook, github]
 *         description: OAuth provider to unlink
 *     responses:
 *       200:
 *         description: Account unlinked successfully
 *       400:
 *         description: Cannot unlink last authentication method
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete(
  "/unlink/:provider",
  authenticate,
  [
    param("provider")
      .isIn(["google", "facebook", "github"])
      .withMessage("Invalid provider"),
  ],
  validateRequest,
  oauthController.unlinkAccount
);

/**
 * @swagger
 * /oauth/linked:
 *   get:
 *     summary: Get linked accounts
 *     description: Retrieve all linked social login accounts
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Linked accounts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     providers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           provider:
 *                             type: string
 *                             example: google
 *                           linkedAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/linked", authenticate, oauthController.getLinkedAccounts);

export default router;
