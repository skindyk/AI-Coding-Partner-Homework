'use strict';

const request = require('supertest');
const createApp = require('../../src/app');

describe('Audit API', () => {
  let app;
  let offeringId;

  beforeEach(async () => {
    app = createApp();

    // Create an offering to generate audit events
    const res = await request(app).post('/api/v1/transactions').send({
      amount: 1000,
      description: 'Test',
      category: 'GLUTTONY'
    });

    offeringId = res.body.data.offering.id;
  });

  describe('GET /api/v1/audit', () => {
    it('should return all audit events', async () => {
      const res = await request(app).get('/api/v1/audit');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.events).toBeDefined();
      expect(Array.isArray(res.body.data.events)).toBe(true);
      expect(res.body.data.count).toBeDefined();
    });

    it('should filter by action', async () => {
      const res = await request(app).get('/api/v1/audit?action=OFFERING_CREATED');

      expect(res.status).toBe(200);
      const createdEvents = res.body.data.events.filter(e => e.action === 'OFFERING_CREATED');
      expect(createdEvents.length).toBe(res.body.data.events.length);
    });

    it('should filter by entityType', async () => {
      const res = await request(app).get('/api/v1/audit?entityType=Offering');

      expect(res.status).toBe(200);
      expect(res.body.data.events.length).toBeGreaterThan(0);
    });

    it('should mask amounts by default', async () => {
      const res = await request(app).get('/api/v1/audit');

      const eventsWithSnapshots = res.body.data.events.filter(
        e => e.afterSnapshot && e.afterSnapshot.amount
      );

      eventsWithSnapshots.forEach(event => {
        expect(event.afterSnapshot.amount).toBe('$**.**');
      });
    });

    it('should unmask amounts with correct header', async () => {
      const res = await request(app)
        .get('/api/v1/audit?unmask=true')
        .set('x-role', 'ops');

      expect(res.status).toBe(200);

      const eventsWithSnapshots = res.body.data.events.filter(
        e => e.afterSnapshot && e.afterSnapshot.amount !== undefined
      );

      eventsWithSnapshots.forEach(event => {
        if (typeof event.afterSnapshot.amount === 'number') {
          expect(event.afterSnapshot.amount).toBeGreaterThan(0);
        }
      });
    });

    it('should not unmask without ops role', async () => {
      const res = await request(app).get('/api/v1/audit?unmask=true');

      const eventsWithSnapshots = res.body.data.events.filter(
        e => e.afterSnapshot && e.afterSnapshot.amount
      );

      eventsWithSnapshots.forEach(event => {
        expect(event.afterSnapshot.amount).toBe('$**.**');
      });
    });
  });

  describe('GET /api/v1/audit/:entityId', () => {
    it('should return events for specific entity', async () => {
      const res = await request(app).get(`/api/v1/audit/${offeringId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.entityId).toBe(offeringId);
      expect(res.body.data.events.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent entity', async () => {
      const res = await request(app).get('/api/v1/audit/nonexistent');

      expect(res.status).toBe(200);
      expect(res.body.data.events).toEqual([]);
    });

    it('should mask amounts for entity audit trail', async () => {
      const res = await request(app).get(`/api/v1/audit/${offeringId}`);

      const eventsWithSnapshots = res.body.data.events.filter(
        e => e.afterSnapshot && e.afterSnapshot.amount
      );

      eventsWithSnapshots.forEach(event => {
        expect(event.afterSnapshot.amount).toBe('$**.**');
      });
    });
  });

  describe('Audit trail on operations', () => {
    it('should log offering creation', async () => {
      const createRes = await request(app).post('/api/v1/transactions').send({
        amount: 2000,
        description: 'New offering',
        category: 'VANITY'
      });

      const id = createRes.body.data.offering.id;
      const auditRes = await request(app).get(`/api/v1/audit/${id}`);

      const createdEvent = auditRes.body.data.events.find(e => e.action === 'OFFERING_CREATED');
      expect(createdEvent).toBeDefined();
    });

    it('should log offering update', async () => {
      await request(app).put(`/api/v1/transactions/${offeringId}`).send({
        description: 'Updated'
      });

      const auditRes = await request(app).get(`/api/v1/audit/${offeringId}`);

      const updateEvent = auditRes.body.data.events.find(e => e.action === 'OFFERING_UPDATED');
      expect(updateEvent).toBeDefined();
    });

    it('should log offering deletion', async () => {
      await request(app).delete(`/api/v1/transactions/${offeringId}`);

      const auditRes = await request(app).get(`/api/v1/audit/${offeringId}`);

      const deleteEvent = auditRes.body.data.events.find(e => e.action === 'OFFERING_DELETED');
      expect(deleteEvent).toBeDefined();
    });
  });
});
