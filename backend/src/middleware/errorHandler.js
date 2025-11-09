const { AppError, serverError } = require('../utils/errors');

function errorHandler(err, _req, res, _next) {
  const error = err instanceof AppError ? err : serverError(err.message);
  const payload = {
    message: error.message || 'Something went wrong',
  };

  if (process.env.NODE_ENV === 'development' && error.stack) {
    payload.stack = error.stack;
  }

  res.status(error.statusCode || 500).json(payload);
}

module.exports = errorHandler;
