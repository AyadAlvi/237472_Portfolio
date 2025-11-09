const jwt = require('jsonwebtoken');
const { unauthorized, forbidden } = require('../utils/errors');

const JWT_SECRET = process.env.JWT_SECRET || 'craft-market-secret';

/**
 * Ensures a valid JWT is provided and attaches the decoded payload to req.user.
 */
function requireAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw unauthorized('Authorization header missing');
  }

  try {
    const token = authHeader.replace('Bearer ', '').trim();
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
      vendorId: payload.vendorId || null,
    };
    next();
  } catch (error) {
    throw unauthorized('Invalid or expired token');
  }
}

/**
 * Restricts route access to the supplied roles.
 * @param  {...string} roles
 */
function requireRole(...roles) {
  return function roleGuard(req, _res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      throw forbidden('Access denied for this role');
    }
    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
  JWT_SECRET,
};
