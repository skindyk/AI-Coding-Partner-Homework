'use strict';

const { v4: uuidv4 } = require('uuid');
const ValidationError = require('../errors/ValidationError');

const RITUAL_TYPES = Object.freeze({
  MANTRA: 'MANTRA',
  MATH: 'MATH',
  WAIT: 'WAIT',
  SHAME: 'SHAME'
});

const RITUAL_TYPE_VALUES = Object.values(RITUAL_TYPES);

/**
 * Create a new Demon configuration
 * @param {object} config - Demon configuration
 * @param {string} config.name - Unique demon name (e.g., 'Vogue-Zul')
 * @param {string} config.title - Display title
 * @param {function} config.triggerFn - Function(offering, history) → boolean
 * @param {string} config.ritualType - One of RITUAL_TYPES
 * @param {object} config.ritualConfig - Ritual-specific configuration
 * @param {string} config.punishmentMessage - Message shown to user
 * @returns {object} Frozen demon object with id
 */
function create(config) {
  if (!config || typeof config !== 'object') {
    throw new ValidationError('Config must be an object');
  }

  const { name, title, triggerFn, ritualType, ritualConfig, punishmentMessage } = config;

  // Validate name
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new ValidationError('Demon name is required');
  }

  // Validate title
  if (typeof title !== 'string' || title.trim().length === 0) {
    throw new ValidationError('Demon title is required');
  }

  // Validate triggerFn
  if (typeof triggerFn !== 'function') {
    throw new ValidationError('triggerFn must be a function');
  }

  // Validate ritualType
  if (!RITUAL_TYPE_VALUES.includes(ritualType)) {
    throw new ValidationError(`Ritual type must be one of: ${RITUAL_TYPE_VALUES.join(', ')}`);
  }

  // Validate ritualConfig
  if (!ritualConfig || typeof ritualConfig !== 'object') {
    throw new ValidationError('ritualConfig must be an object');
  }

  // Validate punishmentMessage
  if (typeof punishmentMessage !== 'string' || punishmentMessage.trim().length === 0) {
    throw new ValidationError('punishmentMessage is required');
  }

  const demon = Object.freeze({
    id: uuidv4(),
    name,
    title,
    triggerFn,
    ritualType,
    ritualConfig: Object.freeze({ ...ritualConfig }),
    punishmentMessage
  });

  return demon;
}

module.exports = {
  create,
  RITUAL_TYPES,
  ValidationError
};
