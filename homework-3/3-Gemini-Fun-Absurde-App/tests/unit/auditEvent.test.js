'use strict';

const AuditEvent = require('../../src/models/AuditEvent');

describe('AuditEvent', () => {
  describe('create', () => {
    it('should create a valid audit event', () => {
      const event = AuditEvent.create({
        action: 'OFFERING_CREATED',
        entityType: 'Offering',
        entityId: 'offer-1',
        beforeSnapshot: null,
        afterSnapshot: { amount: 1000 }
      });

      expect(event.eventId).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.action).toBe('OFFERING_CREATED');
      expect(event.entityType).toBe('Offering');
      expect(event.entityId).toBe('offer-1');
      expect(event.afterSnapshot.amount).toBe(1000);
    });

    it('should throw if action is invalid', () => {
      expect(() => {
        AuditEvent.create({
          action: 'INVALID_ACTION',
          entityType: 'Test',
          entityId: '1'
        });
      }).toThrow('Action must be one of');
    });

    it('should throw if entityType is missing', () => {
      expect(() => {
        AuditEvent.create({
          action: 'OFFERING_CREATED',
          entityId: '1'
        });
      }).toThrow('entityType is required');
    });

    it('should throw if entityId is missing', () => {
      expect(() => {
        AuditEvent.create({
          action: 'OFFERING_CREATED',
          entityType: 'Offering'
        });
      }).toThrow('entityId is required');
    });

    it('should accept custom timestamp', () => {
      const timestamp = 1000000;
      const event = AuditEvent.create({
        action: 'OFFERING_CREATED',
        entityType: 'Offering',
        entityId: '1',
        timestamp
      });

      expect(event.timestamp).toBe(timestamp);
    });

    it('should accept optional sessionId', () => {
      const event = AuditEvent.create({
        action: 'OFFERING_CREATED',
        entityType: 'Offering',
        entityId: '1',
        sessionId: 'session-123'
      });

      expect(event.sessionId).toBe('session-123');
    });

    it('should freeze the event object', () => {
      const event = AuditEvent.create({
        action: 'OFFERING_CREATED',
        entityType: 'Offering',
        entityId: '1'
      });

      expect(() => {
        event.action = 'DIFFERENT';
      }).toThrow();
    });

    it('should freeze snapshots', () => {
      const event = AuditEvent.create({
        action: 'OFFERING_CREATED',
        entityType: 'Offering',
        entityId: '1',
        afterSnapshot: { amount: 1000 }
      });

      expect(() => {
        event.afterSnapshot.amount = 2000;
      }).toThrow();
    });
  });

  describe('AUDIT_ACTIONS', () => {
    it('should have all audit actions', () => {
      const actions = Object.values(AuditEvent.AUDIT_ACTIONS);
      expect(actions).toContain('OFFERING_CREATED');
      expect(actions).toContain('OFFERING_UPDATED');
      expect(actions).toContain('OFFERING_DELETED');
      expect(actions).toContain('POSSESSION_TRIGGERED');
      expect(actions).toContain('POSSESSION_CLEARED');
      expect(actions).toContain('RITUAL_STARTED');
      expect(actions).toContain('RITUAL_COMPLETED');
      expect(actions).toContain('RITUAL_FAILED');
      expect(actions).toContain('DATA_EXPORTED');
      expect(actions).toContain('DATA_PURGED');
    });
  });
});
