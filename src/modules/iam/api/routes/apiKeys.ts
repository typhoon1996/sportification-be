import {Router} from "express";
import {body, param, query} from "express-validator";
import {authenticate} from "../../../../shared/middleware/auth";
import {authLimiter} from "../../../../shared/middleware/security";
import {validateRequest} from "../../../../shared/middleware/validation";
import {ApiKeyController} from "../controllers/ApiKeyController";

const router = Router();

// Apply auth rate limiter to all routes
router.use(authLimiter);

// Validation middleware
const createApiKeyValidation = [
  body("name")
    .notEmpty()
    .withMessage("API key name is required")
    .isLength({min: 1, max: 100})
    .withMessage("API key name must be between 1 and 100 characters"),
  body("permissions")
    .optional()
    .isArray()
    .withMessage("Permissions must be an array"),
  body("allowedIPs")
    .optional()
    .isArray()
    .withMessage("Allowed IPs must be an array"),
  body("expiresInDays")
    .optional()
    .isInt({min: 1, max: 365})
    .withMessage("Expiration must be between 1 and 365 days"),
  body("maxRequests")
    .optional()
    .isInt({min: 1, max: 10000})
    .withMessage("Max requests must be between 1 and 10000"),
  body("windowMs")
    .optional()
    .isInt({min: 60000, max: 86400000})
    .withMessage("Window must be between 1 minute and 24 hours"),
];

const updateApiKeyValidation = [
  param("keyId").isMongoId().withMessage("Invalid API key ID"),
  body("name")
    .optional()
    .isLength({min: 1, max: 100})
    .withMessage("API key name must be between 1 and 100 characters"),
  body("permissions")
    .optional()
    .isArray()
    .withMessage("Permissions must be an array"),
  body("allowedIPs")
    .optional()
    .isArray()
    .withMessage("Allowed IPs must be an array"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  body("maxRequests")
    .optional()
    .isInt({min: 1, max: 10000})
    .withMessage("Max requests must be between 1 and 10000"),
  body("windowMs")
    .optional()
    .isInt({min: 60000, max: 86400000})
    .withMessage("Window must be between 1 minute and 24 hours"),
];

const listApiKeysValidation = [
  query("page")
    .optional()
    .isInt({min: 1})
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({min: 1, max: 100})
    .withMessage("Limit must be between 1 and 100"),
];

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api-keys:
 *   post:
 *     summary: Create a new API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My API Key"
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [read:users, write:users, read:matches, write:matches, read:tournaments, write:tournaments, read:venues, write:venues, admin:all]
 *                 example: ["read:matches", "read:tournaments"]
 *               allowedIPs:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["192.168.1.1", "10.0.0.1"]
 *               expiresInDays:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 365
 *                 example: 90
 *               maxRequests:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10000
 *                 example: 1000
 *               windowMs:
 *                 type: integer
 *                 minimum: 60000
 *                 maximum: 86400000
 *                 example: 3600000
 *     responses:
 *       201:
 *         description: API key created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  createApiKeyValidation,
  validateRequest,
  ApiKeyController.createApiKey
);

/**
 * @swagger
 * /api-keys:
 *   get:
 *     summary: List user's API keys
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: API keys retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  listApiKeysValidation,
  validateRequest,
  ApiKeyController.listApiKeys
);

/**
 * @swagger
 * /api-keys/stats:
 *   get:
 *     summary: Get API key usage statistics
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/stats", ApiKeyController.getApiKeyStats);

/**
 * @swagger
 * /api-keys/{keyId}:
 *   get:
 *     summary: Get specific API key details
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *         description: API key ID
 *     responses:
 *       200:
 *         description: API key retrieved successfully
 *       404:
 *         description: API key not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/:keyId",
  [param("keyId").isMongoId()],
  validateRequest,
  ApiKeyController.getApiKey
);

/**
 * @swagger
 * /api-keys/{keyId}:
 *   patch:
 *     summary: Update API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *         description: API key ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *               allowedIPs:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *               maxRequests:
 *                 type: integer
 *               windowMs:
 *                 type: integer
 *     responses:
 *       200:
 *         description: API key updated successfully
 *       404:
 *         description: API key not found
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/:keyId",
  updateApiKeyValidation,
  validateRequest,
  ApiKeyController.updateApiKey
);

/**
 * @swagger
 * /api-keys/{keyId}:
 *   delete:
 *     summary: Delete API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *         description: API key ID
 *     responses:
 *       200:
 *         description: API key deleted successfully
 *       404:
 *         description: API key not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/:keyId",
  [param("keyId").isMongoId()],
  validateRequest,
  ApiKeyController.deleteApiKey
);

/**
 * @swagger
 * /api-keys/{keyId}/regenerate:
 *   post:
 *     summary: Regenerate API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *         description: API key ID
 *     responses:
 *       200:
 *         description: API key regenerated successfully
 *       404:
 *         description: API key not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/:keyId/regenerate",
  [param("keyId").isMongoId()],
  validateRequest,
  ApiKeyController.regenerateApiKey
);

export default router;
