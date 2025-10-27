import {Request, Response, NextFunction} from "express";
import {
  validationResult,
  ValidationChain,
  ValidationError,
  query,
  param,
} from "express-validator";
import logger from "../infrastructure/logging";
import {IApiError} from "../types";

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: unknown;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const formatValidationErrors = (
  errors: ValidationError[]
): ValidationErrorDetail[] =>
  errors.map(error => ({
    field: error.type === "field" ? error.path : "unknown",
    message: error.msg,
    value: error.type === "field" ? error.value : undefined,
  }));

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    next();
    return;
  }

  const validationErrors = formatValidationErrors(errors.array());

  logger.warn("Validation failed", validationErrors);

  const apiError: IApiError = {
    message: "Validation failed",
    statusCode: 400,
    code: "VALIDATION_ERROR",
    details: validationErrors,
  };

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    errors: validationErrors.map(err => err.message),
    details: validationErrors,
  });
};

export const validateRequest = handleValidationErrors;

export const validate =
  (validations: ValidationChain[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    handleValidationErrors(req, res, next);
  };

export const isValidObjectId = (value: string): boolean =>
  /^[0-9a-fA-F]{24}$/.test(value);

export const isValidArray = (
  value: unknown,
  minLength = 0,
  maxLength = 100
): boolean =>
  Array.isArray(value) &&
  value.length >= minLength &&
  value.length <= maxLength;

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPhoneNumber = (phone: string): boolean =>
  /^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ""));

export const isValidURL = (
  url: string,
  protocols: string[] = ["http:", "https:"]
): boolean => {
  try {
    const parsed = new URL(url);
    return protocols.includes(parsed.protocol);
  } catch {
    return false;
  }
};

export const isValidPassword = (password: string): boolean =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

export const sanitizeString = (str?: string | null): string =>
  (str ?? "").trim().replace(/[<>]/g, "");

export const sanitizeHTML = (str?: string | null): string =>
  (str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

export const validatePagination = (page?: string, limit?: string) => {
  const pageNum = Number.parseInt(page ?? `${DEFAULT_PAGE}`, 10);
  const limitNum = Number.parseInt(limit ?? `${DEFAULT_LIMIT}`, 10);

  const validatedPage = Number.isNaN(pageNum)
    ? DEFAULT_PAGE
    : Math.max(1, pageNum);
  const validatedLimit = Number.isNaN(limitNum)
    ? DEFAULT_LIMIT
    : Math.min(Math.max(1, limitNum), MAX_LIMIT);

  return {
    page: validatedPage,
    limit: validatedLimit,
    skip: (validatedPage - 1) * validatedLimit,
  };
};

export const validateSort = (sort?: string): Record<string, 1 | -1> => {
  if (!sort) return {createdAt: -1};

  return sort.split(",").reduce<Record<string, 1 | -1>>((acc, field) => {
    const trimmed = field.trim();
    if (!trimmed) return acc;

    if (trimmed.startsWith("-")) {
      const fieldName = trimmed.substring(1);
      if (fieldName) acc[fieldName] = -1;
    } else {
      acc[trimmed] = 1;
    }

    return acc;
  }, {});
};

export const isValidFileType = (
  mimetype: string,
  allowedTypes: string[]
): boolean => allowedTypes.includes(mimetype);

export const isValidFileSize = (size: number, maxSize: number): boolean =>
  size > 0 && size <= maxSize;

export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !Number.isNaN(date.getTime());
};

export const isFutureDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return isValidDate(dateString) && date > new Date();
};

export const isPastDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return isValidDate(dateString) && date < new Date();
};

export const paginationValidation: ValidationChain[] = [
  query("page").optional().isInt({min: 1}).toInt(),
  query("limit").optional().isInt({min: 1, max: MAX_LIMIT}).toInt(),
];

export const idParamValidation: ValidationChain[] = [
  param("id")
    .custom(isValidObjectId)
    .withMessage("Invalid identifier supplied"),
];

export {
  validationResult,
  ValidationChain,
  ValidationError,
  matchedData,
  matchedData as extractValidatedData,
} from "express-validator";
