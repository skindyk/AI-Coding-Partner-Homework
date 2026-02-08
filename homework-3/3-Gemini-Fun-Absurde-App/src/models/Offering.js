'use strict';

const { v4: uuidv4 } = require('uuid');
const ValidationError = require('../errors/ValidationError');

const SIN_CATEGORIES = Object.freeze({
  GLUTTONY: 'GLUTTONY',
  VANITY: 'VANITY',
  SLOTH: 'SLOTH',
  GREED: 'GREED',
  LUST: 'LUST',
  WRATH: 'WRATH'
});

const SIN_CATEGORY_VALUES = Object.values(SIN_CATEGORIES);

/**
 * Create a new Offering (transaction) record
 * @param {object} data - Transaction data
 * @param {number} data.amount - Amount in cents (integer)
 * @param {string} data.description - Transaction description
 * @param {string} data.category - One of SIN_CATEGORIES
 * @param {number} [data.timestamp] - Unix milliseconds (defaults to Date.now())
 * @param {boolean} [data.isExorcised] - Whether possession has been cleared (defaults to false)
 * @returns {object} Frozen offering object with id
 */
function create(data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Data must be an object');
  }

  const { amount, description, category, timestamp = Date.now(), isExorcised = false } = data;

  // Validate amount
  if (typeof amount !== 'number' || !Number.isInteger(amount)) {
    throw new ValidationError('Amount must be an integer');
  }
  if (amount <= 0) {
    throw new ValidationError('Amount must be positive (> 0)');
  }

  // Validate description
  if (typeof description !== 'string' || description.trim().length === 0) {
    throw new ValidationError('Description is required and must be a non-empty string');
  }
  const sanitisedDescription = description.trim();
  if (sanitisedDescription.length > 200) {
    throw new ValidationError('Description must not exceed 200 characters');
  }

  // Validate category
  if (!SIN_CATEGORY_VALUES.includes(category)) {
    throw new ValidationError(`Category must be one of: ${SIN_CATEGORY_VALUES.join(', ')}`);
  }

  // Validate timestamp
  if (typeof timestamp !== 'number' || !Number.isInteger(timestamp) || timestamp < 0) {
    throw new ValidationError('Timestamp must be a non-negative integer (Unix milliseconds)');
  }

  // Validate isExorcised
  if (typeof isExorcised !== 'boolean') {
    throw new ValidationError('isExorcised must be a boolean');
  }

  const offering = Object.freeze({
    id: uuidv4(),
    amount,
    description: sanitisedDescription,
    category,
    timestamp,
    isExorcised
  });

  return offering;
}

module.exports = {
  create,
  SIN_CATEGORIES,
  ValidationError
};
