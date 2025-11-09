class AppError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    if (details) {
      this.details = details;
    }
    Error.captureStackTrace?.(this, AppError);
  }
}

const buildError = (status, message) => new AppError(status, message);

module.exports = {
  AppError,
  badRequest: (message = 'Bad request') => buildError(400, message),
  unauthorized: (message = 'Unauthorized') => buildError(401, message),
  forbidden: (message = 'Forbidden') => buildError(403, message),
  notFound: (message = 'Not found') => buildError(404, message),
  serverError: (message = 'Internal server error') => buildError(500, message),
};
