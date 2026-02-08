'use strict';

const request = require('supertest');
const createApp = require('../../src/app');

describe('Transaction API', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  describe('POST /api/v1/transactions', () => {
    it('should create a new transaction', async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .send({
          amount: 1000,
          description: 'Coffee',
          category: 'GLUTTONY'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.offering.id).toBeDefined();
      expect(res.body.data.offering.amount).toBe(1000);
      expect(res.body.data.possession).toBeNull(); // No demon triggered
    });

    it('should sanitise description', async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .send({
          amount: 1000,
          description: '<script>alert("xss")</script>',
          category: 'GLUTTONY'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.offering.description).not.toContain('<script>');
      expect(res.body.data.offering.description).toContain('&lt;');
    });

    it('should reject invalid amount', async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .send({
          amount: 'not a number',
          description: 'Test',
          category: 'GLUTTONY'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject missing description', async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .send({
          amount: 1000,
          category: 'GLUTTONY'
        });

      expect(res.status).toBe(400);
    });

    it('should reject invalid category', async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .send({
          amount: 1000,
          description: 'Test',
          category: 'INVALID'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/transactions', () => {
    it('should return all transactions', async () => {
      // Create two transactions
      await request(app).post('/api/v1/transactions').send({
        amount: 1000,
        description: 'Test 1',
        category: 'GLUTTONY'
      });

      await request(app).post('/api/v1/transactions').send({
        amount: 2000,
        description: 'Test 2',
        category: 'VANITY'
      });

      const res = await request(app).get('/api/v1/transactions');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should return empty array when no transactions', async () => {
      const res = await request(app).get('/api/v1/transactions');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/v1/transactions/:id', () => {
    it('should get a transaction by id', async () => {
      const createRes = await request(app).post('/api/v1/transactions').send({
        amount: 1000,
        description: 'Test',
        category: 'GLUTTONY'
      });

      const id = createRes.body.data.offering.id;
      const res = await request(app).get(`/api/v1/transactions/${id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(id);
    });

    it('should return 404 for non-existent transaction', async () => {
      const res = await request(app).get('/api/v1/transactions/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/transactions/:id', () => {
    it('should update transaction description', async () => {
      const createRes = await request(app).post('/api/v1/transactions').send({
        amount: 1000,
        description: 'Original',
        category: 'GLUTTONY'
      });

      const id = createRes.body.data.offering.id;
      const updateRes = await request(app).put(`/api/v1/transactions/${id}`).send({
        description: 'Updated'
      });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.description).toBe('Updated');
    });

    it('should prevent updating amount', async () => {
      const createRes = await request(app).post('/api/v1/transactions').send({
        amount: 1000,
        description: 'Test',
        category: 'GLUTTONY'
      });

      const id = createRes.body.data.offering.id;
      const updateRes = await request(app).put(`/api/v1/transactions/${id}`).send({
        amount: 2000
      });

      expect(updateRes.status).toBe(400);
      expect(updateRes.body.error.message).toContain('immutable');
    });

    it('should mark as exorcised', async () => {
      const createRes = await request(app).post('/api/v1/transactions').send({
        amount: 1000,
        description: 'Test',
        category: 'GLUTTONY'
      });

      const id = createRes.body.data.offering.id;
      const updateRes = await request(app).put(`/api/v1/transactions/${id}`).send({
        isExorcised: true
      });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.isExorcised).toBe(true);
    });

    it('should return 404 for non-existent transaction', async () => {
      const res = await request(app).put('/api/v1/transactions/nonexistent').send({
        description: 'Updated'
      });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/transactions/:id', () => {
    it('should delete a transaction', async () => {
      const createRes = await request(app).post('/api/v1/transactions').send({
        amount: 1000,
        description: 'Test',
        category: 'GLUTTONY'
      });

      const id = createRes.body.data.offering.id;
      const deleteRes = await request(app).delete(`/api/v1/transactions/${id}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Verify it's gone
      const getRes = await request(app).get(`/api/v1/transactions/${id}`);
      expect(getRes.status).toBe(404);
    });

    it('should return 404 for non-existent transaction', async () => {
      const res = await request(app).delete('/api/v1/transactions/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('Possession triggering', () => {
    it('should trigger possession for high-value VANITY transaction', async () => {
      const res = await request(app).post('/api/v1/transactions').send({
        amount: 10000,
        description: 'Expensive designer dress',
        category: 'VANITY'
      });

      expect(res.status).toBe(201);
      expect(res.body.data.possession).not.toBeNull();
      expect(res.body.data.possession.name).toBe('Vogue-Zul');
    });

    it('should not trigger for low-value VANITY transaction', async () => {
      const res = await request(app).post('/api/v1/transactions').send({
        amount: 1000,
        description: 'Cheap item',
        category: 'VANITY'
      });

      expect(res.status).toBe(201);
      expect(res.body.data.possession).toBeNull();
    });
  });
});
