'use strict';

const { SIN_CATEGORIES } = require('../models/Offering');
const { RITUAL_TYPES } = require('../models/Demon');

/**
 * Validate amount is a positive integer
 */
function validateAmount(amount) {
  if (typeof amount !== 'number' || !Number.isInteger(amount)) {
    return { valid: false, error: 'Amount must be an integer' };
  }
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be positive' };
  }
  return { valid: true };
}

/**
 * Validate description
 */
function validateDescription(description) {
  if (typeof description !== 'string' || description.trim().length === 0) {
    return { valid: false, error: 'Description is required' };
  }
  if (description.length > 200) {
    return { valid: false, error: 'Description must not exceed 200 characters' };
  }
  return { valid: true };
}

/**
 * Validate sin category
 */
function validateCategory(category) {
  const validCategories = Object.values(SIN_CATEGORIES);
  if (!validCategories.includes(category)) {
    return { valid: false, error: `Category must be one of: ${validCategories.join(', ')}` };
  }
  return { valid: true };
}

/**
 * Validate ritual type
 */
function validateRitualType(ritualType) {
  const validTypes = Object.values(RITUAL_TYPES);
  if (!validTypes.includes(ritualType)) {
    return { valid: false, error: `Ritual type must be one of: ${validTypes.join(', ')}` };
  }
  return { valid: true };
}

module.exports = {
  validateAmount,
  validateDescription,
  validateCategory,
  validateRitualType
};
