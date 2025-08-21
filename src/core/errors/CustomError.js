export default class CustomError extends Error {
  constructor(message, { statusCode = 500, code = 'INTERNAL_ERROR', details = null, isOperational = true } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class DomainError extends CustomError {
  constructor(message = 'Domain rule violated', details) {
    super(message, { statusCode: 422, code: 'DOMAIN_ERROR', details });
  }
}

export class NotFoundError extends CustomError {
  constructor(message = 'Resource not found', details) {
    super(message, { statusCode: 404, code: 'NOT_FOUND', details });
  }
}

export class ValidationError extends CustomError {
  constructor(message = 'Validation failed', details) {
    super(message, { statusCode: 400, code: 'VALIDATION_ERROR', details });
  }
}

export class AuthorizationError extends CustomError {
  constructor(message = 'Unauthorized', details) {
    super(message, { statusCode: 401, code: 'UNAUTHORIZED', details });
  }
}

export class ForbiddenError extends CustomError {
  constructor(message = 'Forbidden', details) {
    super(message, { statusCode: 403, code: 'FORBIDDEN', details });
  }
}
