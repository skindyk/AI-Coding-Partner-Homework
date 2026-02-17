'use strict';

const request = require('supertest');
const createApp = require('../../src/app');

describe('Dashboard API', () => {
  let app;

  beforeEach(async () => {
    app = createApp();
  });

  describe('GET /api/v1/dashboard', () => {
    it('should return dashboard data', async () => {
      const res = await request(app).get('/api/v1/dashboard');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.soulPurity).toBeDefined();
      expect(res.body.data.breakdown).toBeDefined();
      expect(res.body.data.totalOfferings).toBe(0);
    });

    it('should return 100% purity with no offerings', async () => {
      const res = await request(app).get('/api/v1/dashboard');
      expect(res.body.data.soulPurity).toBe(100);
    });

    it('should reflect transaction in dashboard', async () => {
      await request(app).post('/api/v1/transactions').send({
        amount: 1000,
        description: 'Coffee',
        category: 'GLUTTONY'
      });

      const res = await request(app).get('/api/v1/dashboard');

      expect(res.body.data.totalOfferings).toBe(1);
      expect(res.body.data.breakdown.GLUTTONY).toBe(1000);
      expect(res.body.data.soulPurity).toBeLessThan(100);
    });

    it('should calculate exorcism success rate', async () => {
      // Create two offerings
      const create1 = await request(app).post('/api/v1/transactions').send({
        amount: 1000,
        description: 'Test 1',
        category: 'GLUTTONY'
      });

      const create2 = await request(app).post('/api/v1/transactions').send({
        amount: 1000,
        description: 'Test 2',
        category: 'GLUTTONY'
      });

      // Mark one as exorcised
      const id1 = create1.body.data.offering.id;
      await request(app).put(`/api/v1/transactions/${id1}`).send({
        isExorcised: true
      });

      const res = await request(app).get('/api/v1/dashboard');

      expect(res.body.data.exorcisedCount).toBe(1);
      expect(res.body.data.exorcismSuccessRate).toBe(50);
    });

    it('should include all sin categories in breakdown', async () => {
      const res = await request(app).get('/api/v1/dashboard');

      expect(res.body.data.breakdown.GLUTTONY).toBeDefined();
      expect(res.body.data.breakdown.VANITY).toBeDefined();
      expect(res.body.data.breakdown.SLOTH).toBeDefined();
      expect(res.body.data.breakdown.GREED).toBeDefined();
      expect(res.body.data.breakdown.LUST).toBeDefined();
      expect(res.body.data.breakdown.WRATH).toBeDefined();
    });
  });
});
