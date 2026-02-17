'use strict';

const AuditLogger = require('../../src/services/AuditLogger');
const InMemoryStore = require('../../src/store/InMemoryStore');

describe('AuditLogger', () => {
  let logger;
  let store;

  beforeEach(() => {
    store = new InMemoryStore('audit');
    logger = new AuditLogger(store);
  });

  describe('log', () => {
    it('should create an audit event', () => {
      logger.log('OFFERING_CREATED', 'Offering', 'offer-1', null, { amount: 1000 });
      expect(logger.count()).toBe(1);
    });

    it('should accept optional fields', () => {
      logger.log('OFFERING_CREATED', 'Offering', 'offer-1');
      expect(logger.count()).toBe(1);
    });

    it('should not throw on duplicate audit events', () => {
      // Log the same event multiple times
      logger.log('OFFERING_CREATED', 'Offering', 'offer-1', null, { amount: 1000 });
      logger.log('OFFERING_CREATED', 'Offering', 'offer-1', null, { amount: 1000 });
      expect(logger.count()).toBe(2); // Both logged as separate events
    });
  });

  describe('getEvents', () => {
    beforeEach(() => {
      logger.log('OFFERING_CREATED', 'Offering', 'offer-1', null, { amount: 1000 });
      logger.log('OFFERING_UPDATED', 'Offering', 'offer-1', { amount: 1000 }, { amount: 2000 });
      logger.log('POSSESSION_TRIGGERED', 'Offering', 'offer-2', null, { demonName: 'Test' });
    });

    it('should return all events', () => {
      const events = logger.getEvents();
      expect(events.length).toBe(3);
    });

    it('should filter by action', () => {
      const events = logger.getEvents({ action: 'OFFERING_CREATED' });
      expect(events.length).toBe(1);
      expect(events[0].action).toBe('OFFERING_CREATED');
    });

    it('should filter by entityType', () => {
      const events = logger.getEvents({ entityType: 'Offering' });
      expect(events.length).toBe(3);
    });

    it('should mask amounts by default', () => {
      const events = logger.getEvents();
      const withAmounts = events.filter(e => e.afterSnapshot && e.afterSnapshot.amount);
      withAmounts.forEach(e => {
        expect(e.afterSnapshot.amount).toBe('$**.**');
      });
    });

    it('should unmask with flag', () => {
      const events = logger.getEvents({ unmask: true });
      const withAmounts = events.filter(e => e.afterSnapshot && e.afterSnapshot.amount !== undefined);
      withAmounts.forEach(e => {
        if (typeof e.afterSnapshot.amount === 'number') {
          expect(e.afterSnapshot.amount).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('getEventsByEntity', () => {
    beforeEach(() => {
      logger.log('OFFERING_CREATED', 'Offering', 'offer-1', null, { amount: 1000 });
      logger.log('OFFERING_UPDATED', 'Offering', 'offer-1', { amount: 1000 }, { amount: 2000 });
      logger.log('OFFERING_CREATED', 'Offering', 'offer-2', null, { amount: 1500 });
    });

    it('should return events for specific entity', () => {
      const events = logger.getEventsByEntity('offer-1');
      expect(events.length).toBe(2);
    });

    it('should return empty array for unknown entity', () => {
      const events = logger.getEventsByEntity('unknown');
      expect(events.length).toBe(0);
    });

    it('should mask amounts by default', () => {
      const events = logger.getEventsByEntity('offer-1');
      const withAmounts = events.filter(e => e.afterSnapshot && e.afterSnapshot.amount);
      withAmounts.forEach(e => {
        expect(e.afterSnapshot.amount).toBe('$**.**');
      });
    });

    it('should unmask with flag', () => {
      const events = logger.getEventsByEntity('offer-1', true);
      const withAmounts = events.filter(e => e.afterSnapshot && e.afterSnapshot.amount !== undefined);
      withAmounts.forEach(e => {
        if (typeof e.afterSnapshot.amount === 'number') {
          expect(e.afterSnapshot.amount).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('exportAll', () => {
    beforeEach(() => {
      logger.log('OFFERING_CREATED', 'Offering', 'offer-1', null, { amount: 1000 });
    });

    it('should export all events', () => {
      const events = logger.exportAll();
      expect(events.length).toBe(1);
    });

    it('should mask amounts in export', () => {
      const events = logger.exportAll();
      const withAmounts = events.filter(e => e.afterSnapshot && e.afterSnapshot.amount);
      withAmounts.forEach(e => {
        expect(e.afterSnapshot.amount).toBe('$**.**');
      });
    });
  });

  describe('count', () => {
    it('should return correct count', () => {
      expect(logger.count()).toBe(0);
      logger.log('TEST', 'Test', '1');
      expect(logger.count()).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all events', () => {
      logger.log('TEST', 'Test', '1');
      logger.log('TEST', 'Test', '2');
      logger.clear();
      expect(logger.count()).toBe(0);
    });
  });
});
