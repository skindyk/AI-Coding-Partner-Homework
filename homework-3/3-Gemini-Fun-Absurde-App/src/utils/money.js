'use strict';

/**
 * Convert dollars string to cents (integer)
 * @param {string|number} dollars - Dollar amount (e.g., "12.99" or 12.99)
 * @returns {number} Amount in cents
 */
function toCents(dollars) {
  if (typeof dollars === 'number') {
    return Math.round(dollars * 100);
  }

  if (typeof dollars === 'string') {
    const num = parseFloat(dollars);
    if (isNaN(num)) {
      throw new Error(`Invalid dollar amount: "${dollars}"`);
    }
    return Math.round(num * 100);
  }

  throw new Error('Input must be a string or number');
}

/**
 * Convert cents to display format
 * @param {number} cents - Amount in cents
 * @param {boolean} [includeSymbol] - Include $ symbol (default true)
 * @returns {string} Formatted amount (e.g., "$12.99")
 */
function toDisplay(cents, includeSymbol = true) {
  if (typeof cents !== 'number' || !Number.isInteger(cents)) {
    throw new Error('Input must be an integer');
  }

  const dollars = cents / 100;
  const formatted = dollars.toFixed(2);

  return includeSymbol ? `$${formatted}` : formatted;
}

/**
 * Add two cent amounts
 * @param {number} cents1
 * @param {number} cents2
 * @returns {number} Sum in cents
 */
function add(cents1, cents2) {
  return cents1 + cents2;
}

/**
 * Subtract two cent amounts
 * @param {number} cents1
 * @param {number} cents2
 * @returns {number} Difference in cents
 */
function subtract(cents1, cents2) {
  return cents1 - cents2;
}

module.exports = {
  toCents,
  toDisplay,
  add,
  subtract
};
