/**
 * Custom application error class
 * Used for throwing application-specific errors with status code and additional metadata
 */
class AppError extends Error {
  /**
   * Create a new AppError
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {Array} [errors=[]] - Optional array of field-specific errors
   */
  constructor(message, statusCode, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create a 400 Bad Request error
 * @param {string} message - Error message
 * @param {Array} [errors=[]] - Optional array of field-specific errors
 * @returns {AppError}
 */
const badRequest = (message = 'Bad Request', errors = []) => {
  return new AppError(message, 400, errors);
};

/**
 * Create a 401 Unauthorized error
 * @param {string} message - Error message
 * @returns {AppError}
 */
const unauthorized = (message = 'Unauthorized') => {
  return new AppError(message, 401);
};

/**
 * Create a 403 Forbidden error
 * @param {string} message - Error message
 * @returns {AppError}
 */
const forbidden = (message = 'Forbidden') => {
  return new AppError(message, 403);
};

/**
 * Create a 404 Not Found error
 * @param {string} message - Error message
 * @returns {AppError}
 */
const notFound = (message = 'Resource not found') => {
  return new AppError(message, 404);
};

/**
 * Create a 409 Conflict error
 * @param {string} message - Error message
 * @returns {AppError}
 */
const conflict = (message = 'Conflict') => {
  return new AppError(message, 409);
};

/**
 * Create a 500 Internal Server Error
 * @param {string} message - Error message
 * @returns {AppError}
 */
const internal = (message = 'Internal Server Error') => {
  return new AppError(message, 500);
};

module.exports = {
  AppError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  internal
};
