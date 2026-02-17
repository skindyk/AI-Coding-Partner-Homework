'use strict';

const AuditEventModel = require('../models/AuditEvent');

/**
 * Audit Logger - Append-only audit trail service
 */
class AuditLogger {
  constructor(auditStore) {
    if (!auditStore) {
      throw new Error('auditStore is required');
    }
    this.auditStore = auditStore;
  }

  /**
   * Log an audit event
   * @param {string} action - Audit action
   * @param {string} entityType - Type of entity
   * @param {string} entityId - ID of entity
   * @param {object} before - Before snapshot
   * @param {object} after - After snapshot
   * @param {string} [sessionId] - Session identifier
   */
  log(action, entityType, entityId, before = null, after = null, sessionId = null) {
    try {
      const event = AuditEventModel.create({
        action,
        entityType,
        entityId,
        beforeSnapshot: before,
        afterSnapshot: after,
        sessionId
      });

      this.auditStore.create(event);
    } catch (err) {
      // Audit logging failures should not crash the application
      console.error('[AuditLogger] Failed to log event:', err.message);
    }
  }

  /**
   * Get all audit events
   * @param {object} [filters] - Optional filters
   * @returns {array} Matching events
   */
  getEvents(filters = {}) {
    let events = this.auditStore.getAll();

    // Filter by action
    if (filters.action) {
      events = events.filter(e => e.action === filters.action);
    }

    // Filter by entity type
    if (filters.entityType) {
      events = events.filter(e => e.entityType === filters.entityType);
    }

    // Filter by date range (from/to in milliseconds)
    if (filters.from) {
      events = events.filter(e => e.timestamp >= filters.from);
    }
    if (filters.to) {
      events = events.filter(e => e.timestamp <= filters.to);
    }

    // Mask amounts by default unless explicitly unmasked
    if (!filters.unmask) {
      events = events.map(e => this.maskEvent(e));
    }

    return events;
  }

  /**
   * Get events by entity ID
   * @param {string} entityId - Entity ID
   * @param {boolean} [unmask] - Whether to unmask amounts
   * @returns {array} Events for this entity
   */
  getEventsByEntity(entityId, unmask = false) {
    let events = this.auditStore.getAll().filter(e => e.entityId === entityId);

    if (!unmask) {
      events = events.map(e => this.maskEvent(e));
    }

    return events;
  }

  /**
   * Export all events
   * @returns {array} All events (masked)
   */
  exportAll() {
    const events = this.auditStore.getAll();
    return events.map(e => this.maskEvent(e));
  }

  /**
   * Mask monetary amounts in an event
   * @private
   */
  maskEvent(event) {
    const masked = { ...event };

    if (event.beforeSnapshot && event.beforeSnapshot.amount !== undefined) {
      masked.beforeSnapshot = {
        ...event.beforeSnapshot,
        amount: '$**.**'
      };
    }

    if (event.afterSnapshot && event.afterSnapshot.amount !== undefined) {
      masked.afterSnapshot = {
        ...event.afterSnapshot,
        amount: '$**.**'
      };
    }

    return masked;
  }

  /**
   * Get total count of audit events
   */
  count() {
    return this.auditStore.count();
  }

  /**
   * Clear all audit events (for testing)
   */
  clear() {
    this.auditStore.clear();
  }
}

module.exports = AuditLogger;
