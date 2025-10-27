import {Router} from "express";
import {body} from "express-validator";
import {authenticate} from "../../../../shared/middleware/auth";
import {authLimiter} from "../../../../shared/middleware/security";
import {validateRequest} from "../../../../shared/middleware/validation";
import {mfaController} from "../controllers/MfaController";

const router = Router();

// Apply auth limiter to all MFA routes
router.use(authLimiter);

/**
 * @swagger
 * /auth/mfa/setup:
 *   get:
 *     summary: Setup MFA for user
 *     description: Generate TOTP secret, QR code, and backup codes for MFA setup
 *     tags: [MFA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA setup data generated successfully
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
 *                     secret:
 *                       type: string
 *                       example: "JBSWY3DPEHPK3PXP"
 *                     qrCode:
 *                       type: string
 *                       example: "data:image/png;base64,..."
 *                     backupCodes:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["ABCD1234", "EFGH5678"]
 *       400:
 *         description: MFA already enabled
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/setup", authenticate, mfaController.setup);

/**
 * @swagger
 * /auth/mfa/enable:
 *   post:
 *     summary: Enable MFA
 *     description: Verify TOTP token and enable two-factor authentication
 *     tags: [MFA]
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
 *               - backupCodes
 *             properties:
 *               secret:
 *                 type: string
 *                 example: "JBSWY3DPEHPK3PXP"
 *               token:
 *                 type: string
 *                 example: "123456"
 *               backupCodes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["ABCD1234", "EFGH5678"]
 *     responses:
 *       200:
 *         description: MFA enabled successfully
 *       400:
 *         description: Invalid token or MFA already enabled
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  "/enable",
  authenticate,
  [
    body("secret").notEmpty().withMessage("Secret is required"),
    body("token")
      .notEmpty()
      .isLength({min: 6, max: 6})
      .withMessage("Token must be 6 digits"),
    body("backupCodes")
      .isArray({min: 1})
      .withMessage("Backup codes are required"),
  ],
  validateRequest,
  mfaController.enable
);

/**
 * @swagger
 * /auth/mfa/verify:
 *   post:
 *     summary: Verify MFA token
 *     description: Verify TOTP token or backup code during login
 *     tags: [MFA]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - token
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               token:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Token verified successfully
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
 *                     verified:
 *                       type: boolean
 *                       example: true
 *                     usedBackupCode:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Invalid token
 */
router.post(
  "/verify",
  [
    body("userId").notEmpty().isMongoId().withMessage("Valid user ID required"),
    body("token").notEmpty().withMessage("Token is required"),
  ],
  validateRequest,
  mfaController.verify
);

/**
 * @swagger
 * /auth/mfa/disable:
 *   post:
 *     summary: Disable MFA
 *     description: Disable two-factor authentication (requires password)
 *     tags: [MFA]
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
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123!"
 *     responses:
 *       200:
 *         description: MFA disabled successfully
 *       400:
 *         description: MFA not enabled
 *       401:
 *         description: Invalid password or not authenticated
 */
router.post(
  "/disable",
  authenticate,
  [body("password").notEmpty().withMessage("Password is required")],
  validateRequest,
  mfaController.disable
);

/**
 * @swagger
 * /auth/mfa/backup-codes:
 *   post:
 *     summary: Regenerate backup codes
 *     description: Generate new backup codes (requires password)
 *     tags: [MFA]
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
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123!"
 *     responses:
 *       200:
 *         description: Backup codes regenerated successfully
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
 *                     backupCodes:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["ABCD1234", "EFGH5678"]
 *       400:
 *         description: MFA not enabled
 *       401:
 *         description: Invalid password or not authenticated
 */
router.post(
  "/backup-codes",
  authenticate,
  [body("password").notEmpty().withMessage("Password is required")],
  validateRequest,
  mfaController.regenerateBackupCodes
);

/**
 * @swagger
 * /auth/mfa/status:
 *   get:
 *     summary: Get MFA status
 *     description: Get current MFA status and backup codes count
 *     tags: [MFA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA status retrieved successfully
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
 *                     isEnabled:
 *                       type: boolean
 *                       example: false
 *                     backupCodesCount:
 *                       type: number
 *                       example: 8
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/status", authenticate, mfaController.getStatus);

export default router;
