import { Router } from "express";
import { authController } from "../controllers/AuthController";
import { authenticate } from "../../../../shared/middleware/auth";
import { validateRequest } from "../../../../shared/middleware/validation";
import {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  changePasswordValidation,
} from "../../../../shared/validators";
import { authLimiter } from "../../../../shared/middleware/security";

const router = Router();

// Apply auth rate limiter to all routes
router.use(authLimiter);

// Public routes
router.post(
  "/register",
  registerValidation,
  validateRequest,
  authController.register
);

router.post("/login", loginValidation, validateRequest, authController.login);

router.post(
  "/refresh-token",
  refreshTokenValidation,
  validateRequest,
  authController.refreshToken
);

// Protected routes
router.post("/logout", authenticate, authController.logout);

router.get("/profile", authenticate, authController.getProfile);

router.put(
  "/change-password",
  authenticate,
  changePasswordValidation,
  validateRequest,
  authController.changePassword
);

router.delete("/deactivate", authenticate, authController.deactivateAccount);

export default router;
