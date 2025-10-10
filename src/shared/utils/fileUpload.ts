/**
 * File Upload Utility
 *
 * Handles file uploads with validation and storage
 */

import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { ValidationError } from '../middleware/errorHandler';
import logger from './logger';

// Allowed file types
export const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
export const ALLOWED_DOCUMENT_TYPES = ['pdf', 'doc', 'docx', 'txt'];
export const ALLOWED_VIDEO_TYPES = ['mp4', 'avi', 'mov', 'webm'];

// Max file sizes (in MB)
export const MAX_IMAGE_SIZE = 5;
export const MAX_DOCUMENT_SIZE = 10;
export const MAX_VIDEO_SIZE = 50;

/**
 * Configure multer storage
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store in different folders based on file type
    let folder = 'uploads/misc';

    if (file.mimetype.startsWith('image/')) {
      folder = 'uploads/images';
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'uploads/videos';
    } else if (file.mimetype === 'application/pdf' || file.mimetype.includes('document')) {
      folder = 'uploads/documents';
    }

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

/**
 * File filter
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);

  // Check if file type is allowed
  const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_VIDEO_TYPES];

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new ValidationError(
        `File type .${ext} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      )
    );
  }
};

/**
 * Base multer configuration
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE * 1024 * 1024, // Max size for any file
  },
});

/**
 * Image upload configuration
 */
export const imageUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);

    if (ALLOWED_IMAGE_TYPES.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new ValidationError(
          `Only image files are allowed. Supported: ${ALLOWED_IMAGE_TYPES.join(', ')}`
        )
      );
    }
  },
  limits: {
    fileSize: MAX_IMAGE_SIZE * 1024 * 1024,
  },
});

/**
 * Document upload configuration
 */
export const documentUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);

    if (ALLOWED_DOCUMENT_TYPES.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new ValidationError(
          `Only document files are allowed. Supported: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`
        )
      );
    }
  },
  limits: {
    fileSize: MAX_DOCUMENT_SIZE * 1024 * 1024,
  },
});

/**
 * Avatar upload configuration (stricter limits)
 */
export const avatarUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);

    if (ALLOWED_IMAGE_TYPES.includes(ext)) {
      cb(null, true);
    } else {
      cb(new ValidationError('Only image files are allowed for avatars'));
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for avatars
  },
});

/**
 * Get file URL
 */
export const getFileUrl = (filename: string, baseUrl: string): string => {
  return `${baseUrl}/uploads/${filename}`;
};

/**
 * Delete file helper
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const fs = require('fs').promises;
    await fs.unlink(filePath);
    logger.info(`File deleted: ${filePath}`);
  } catch (error) {
    logger.error(`Failed to delete file: ${filePath}`, error);
  }
};
