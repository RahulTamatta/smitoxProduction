import CustomError, { ValidationError } from './CustomError.js';

// Express error-handling middleware
export function errorHandler(err, req, res, next) {
  const isKnown = err instanceof CustomError || err instanceof ValidationError;

  const status = isKnown ? err.statusCode : 500;
  const code = isKnown ? err.code : 'INTERNAL_ERROR';
  const message = isKnown ? err.message : 'Something went wrong';

  // Basic logging; can be replaced by proper logger later
  if (!isKnown) {
    // eslint-disable-next-line no-console
    console.error('[ERROR]', { message: err.message, stack: err.stack });
  }

  res.status(status).json({
    success: false,
    error: { code, message, details: err.details ?? null }
  });
}
