import { Request, Response, NextFunction } from 'express';
import { User } from '../../modules/users/domain/models';
import { JWTUtil } from '../utils/jwt';
import { IApiError } from '../types';
import logger from '../utils/logger';

// Extend Express Request interface to include user
declare module 'express' {
  interface Request {
    user?: any;
    userId?: string;
    resourceField?: string;
    participantField?: string;
  }
}

export interface AuthRequest extends Request {
  user: any;
  userId: string;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from authorization header
    const token = JWTUtil.extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      const error: IApiError = {
        message: 'Access token is required',
        statusCode: 401,
        code: 'NO_TOKEN',
      };
      res.status(401).json({
        success: false,
        message: error.message,
        errors: [error.message],
      });
      return;
    }

    // Verify token
    const decoded = JWTUtil.verifyAccessToken(token);

    // Find user
    const user = await User.findById(decoded.userId).populate('profile').select('+refreshTokens');

    if (!user || !user.isActive) {
      const error: IApiError = {
        message: 'User not found or inactive',
        statusCode: 401,
        code: 'USER_NOT_FOUND',
      };
      res.status(401).json({
        success: false,
        message: error.message,
        errors: [error.message],
      });
      return;
    }

    // Update last login time
    user.lastLoginAt = new Date();
    await user.save();

    // Attach user to request
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error: any) {
    logger.error('Authentication error:', error);

    const statusCode = 401;
    let message = 'Authentication failed';
    let code = 'AUTH_FAILED';

    if (error.message === 'Token expired') {
      message = 'Access token has expired';
      code = 'TOKEN_EXPIRED';
    } else if (error.message === 'Invalid token') {
      message = 'Invalid access token';
      code = 'INVALID_TOKEN';
    }

    res.status(statusCode).json({
      success: false,
      message,
      errors: [message],
      code,
    });
  }
};

export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = JWTUtil.extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return next();
    }

    const decoded = JWTUtil.verifyAccessToken(token);
    const user = await User.findById(decoded.userId).populate('profile');

    if (user && user.isActive) {
      req.user = user;
      req.userId = user.id;
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    // For optional auth, we just continue without user
    next();
  }
};

// Role-based authorization middleware
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        errors: ['User not authenticated'],
      });
      return;
    }

    // For now, we'll use a simple role system
    // In a real app, you'd have proper role management
    const userRole = req.user.role || 'user';

    if (!roles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        errors: ['User does not have required permissions'],
      });
      return;
    }

    next();
  };
};

// Check if user owns resource
export const requireOwnership = (resourceField = 'createdBy') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        errors: ['User not authenticated'],
      });
      return;
    }

    // Store the resource field for later use in controllers
    req.resourceField = resourceField;
    next();
  };
};

// Check if user is participant in resource
export const requireParticipation = (participantField = 'participants') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        errors: ['User not authenticated'],
      });
      return;
    }

    // Store the participant field for later use in controllers
    req.participantField = participantField;
    next();
  };
};
