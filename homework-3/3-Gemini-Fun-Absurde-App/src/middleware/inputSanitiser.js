'use strict';

const validator = require('validator');

/**
 * Recursively sanitise string values in an object
 */
function sanitiseValue(value) {
  if (typeof value === 'string') {
    return validator.escape(value);
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return sanitiseObject(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitiseValue);
  }
  return value;
}

/**
 * Recursively sanitise all string fields in an object
 */
function sanitiseObject(obj) {
  const sanitised = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitised[key] = sanitiseValue(value);
  }
  return sanitised;
}

/**
 * Middleware to sanitise request body
 */
function sanitiseBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitiseObject(req.body);
  }
  next();
}

module.exports = {
  sanitiseBody,
  sanitiseValue,
  sanitiseObject
};
