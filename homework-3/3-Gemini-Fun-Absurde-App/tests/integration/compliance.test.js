'use strict';

const request = require('supertest');
const createApp = require('../../src/app');

describe('Compliance API', () => {
  let app;

  beforeEach(async () => {
    app = createApp();
    // Create some data
    await request(app).post('/api/v1/transactions').send({
      amount: 1000,
      description: 'Test',
      category: 'GLUTTONY'
    });
  });

  describe('GET /api/v1/compliance/export', () => {
    it('should export all data', async () => {
      const res = await request(app).get('/api/v1/compliance/export');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.offerings).toBeDefined();
      expect(res.body.data.auditEvents).toBeDefined();
      expect(res.body.data.offerings.length).toBeGreaterThan(0);
    });

    it('should have Content-Disposition header', async () => {
      const res = await request(app).get('/api/v1/compliance/export');
      expect(res.get('Content-Disposition')).toContain('attachment');
    });
  });

  describe('DELETE /api/v1/compliance/purge', () => {
    it('should require confirmation header', async () => {
      const res = await request(app).delete('/api/v1/compliance/purge');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PURGE_CONFIRMATION_REQUIRED');
    });

    it('should purge with correct confirmation', async () => {
      const res = await request(app)
        .delete('/api/v1/compliance/purge')
        .set('x-confirm-purge', 'yes');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.offeringsPurged).toBeGreaterThan(0);
    });

    it('should clear all data after purge', async () => {
      await request(app)
        .delete('/api/v1/compliance/purge')
        .set('x-confirm-purge', 'yes');

      const getRes = await request(app).get('/api/v1/transactions');
      expect(getRes.body.data).toEqual([]);
    });

    it('should reject wrong confirmation value', async () => {
      const res = await request(app)
        .delete('/api/v1/compliance/purge')
        .set('x-confirm-purge', 'maybe');

      expect(res.status).toBe(400);
    });
  });
});
