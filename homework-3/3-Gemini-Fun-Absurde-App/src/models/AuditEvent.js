'use strict';

const { v4: uuidv4 } = require('uuid');
const ValidationError = require('../errors/ValidationError');

const AUDIT_ACTIONS = Object.freeze({
  OFFERING_CREATED: 'OFFERING_CREATED',
  OFFERING_UPDATED: 'OFFERING_UPDATED',
  OFFERING_DELETED: 'OFFERING_DELETED',
  POSSESSION_TRIGGERED: 'POSSESSION_TRIGGERED',
  POSSESSION_CLEARED: 'POSSESSION_CLEARED',
  RITUAL_STARTED: 'RITUAL_STARTED',
  RITUAL_COMPLETED: 'RITUAL_COMPLETED',
  RITUAL_FAILED: 'RITUAL_FAILED',
  DATA_EXPORTED: 'DATA_EXPORTED',
  DATA_PURGED: 'DATA_PURGED'
});

const AUDIT_ACTION_VALUES = Object.values(AUDIT_ACTIONS);

/**
 * Create a new AuditEvent
 * @param {object} data - Event data
 * @param {string} data.action - One of AUDIT_ACTIONS
 * @param {string} data.entityType - Type of entity affected (e.g., 'Offering', 'Possession')
 * @param {string} data.entityId - ID of affected entity
 * @param {object} [data.beforeSnapshot] - State before the action
 * @param {object} [data.afterSnapshot] - State after the action
 * @param {string} [data.sessionId] - Session identifier
 * @param {number} [data.timestamp] - Unix milliseconds (defaults to Date.now())
 * @returns {object} Frozen audit event
 */
function create(data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Data must be an object');
  }

  const {
    action,
    entityType,
    entityId,
    beforeSnapshot = null,
    afterSnapshot = null,
    sessionId = null,
    timestamp = Date.now()
  } = data;

  // Validate action
  if (!AUDIT_ACTION_VALUES.includes(action)) {
    throw new ValidationError(`Action must be one of: ${AUDIT_ACTION_VALUES.join(', ')}`);
  }

  // Validate entityType
  if (typeof entityType !== 'string' || entityType.trim().length === 0) {
    throw new ValidationError('entityType is required');
  }

  // Validate entityId
  if (typeof entityId !== 'string' || entityId.trim().length === 0) {
    throw new ValidationError('entityId is required');
  }

  // Validate timestamp
  if (typeof timestamp !== 'number' || !Number.isInteger(timestamp) || timestamp < 0) {
    throw new ValidationError('Timestamp must be a non-negative integer');
  }

  const eventId = uuidv4();
  const auditEvent = Object.freeze({
    eventId,
    id: eventId, // Alias for InMemoryStore compatibility
    timestamp,
    action,
    entityType,
    entityId,
    beforeSnapshot: beforeSnapshot ? Object.freeze({ ...beforeSnapshot }) : null,
    afterSnapshot: afterSnapshot ? Object.freeze({ ...afterSnapshot }) : null,
    sessionId
  });

  return auditEvent;
}

module.exports = {
  create,
  AUDIT_ACTIONS,
  ValidationError
};
