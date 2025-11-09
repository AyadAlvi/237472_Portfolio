const { badRequest } = require('./errors');

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const isEmail = (value) => isNonEmptyString(value) && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());

const ensureNonEmptyString = (value, field) => {
  if (!isNonEmptyString(value)) {
    throw badRequest(`${field} is required`);
  }
  return value.trim();
};

const ensureEmail = (value) => {
  const trimmed = ensureNonEmptyString(value, 'Email');
  if (!isEmail(trimmed)) {
    throw badRequest('Email is invalid');
  }
  return trimmed.toLowerCase();
};

const ensureNumber = (value, field, { min, max } = {}) => {
  const num = Number(value);
  if (Number.isNaN(num)) {
    throw badRequest(`${field} must be a number`);
  }
  if (typeof min === 'number' && num < min) {
    throw badRequest(`${field} must be at least ${min}`);
  }
  if (typeof max === 'number' && num > max) {
    throw badRequest(`${field} must be at most ${max}`);
  }
  return num;
};

module.exports = {
  ensureNonEmptyString,
  ensureEmail,
  ensureNumber,
  isNonEmptyString,
};
