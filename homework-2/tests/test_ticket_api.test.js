const request = require('supertest');
const app = require('../src/app');

describe('Ticket API Endpoints', () => {
  const validTicket = {
    customer_id: 'cust_001',
    customer_email: 'user@example.com',
    customer_name: 'Jane Smith',
    subject: 'Payment issue on my account',
    description: 'I was charged twice for my subscription this month. Please help me resolve this billing issue.',
    category: 'billing_question',
    priority: 'high',
    status: 'new',
    tags: ['billing', 'payment'],
    metadata: {
      source: 'web_form',
      browser: 'Firefox',
      device_type: 'mobile'
    }
  };

  test('POST /api/tickets - should create a new ticket', async () => {
    const response = await request(app)
      .post('/api/tickets')
      .send(validTicket);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.ticket.id).toBeDefined();
    expect(response.body.ticket.customer_email).toBe('user@example.com');
  });

  test('POST /api/tickets - should fail with invalid email', async () => {
    const response = await request(app)
      .post('/api/tickets')
      .send({ ...validTicket, customer_email: 'invalid' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('GET /api/tickets - should return all tickets', async () => {
    // Create a ticket first
    await request(app).post('/api/tickets').send(validTicket);

    const response = await request(app).get('/api/tickets');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.count).toBeGreaterThan(0);
    expect(Array.isArray(response.body.tickets)).toBe(true);
  });

  test('GET /api/tickets?category=billing_question - should filter by category', async () => {
    const response = await request(app)
      .get('/api/tickets')
      .query({ category: 'billing_question' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.tickets.every(t => t.category === 'billing_question')).toBe(true);
  });

  test('GET /api/tickets?priority=high - should filter by priority', async () => {
    const response = await request(app)
      .get('/api/tickets')
      .query({ priority: 'high' });

    expect(response.status).toBe(200);
    expect(response.body.tickets.every(t => t.priority === 'high')).toBe(true);
  });

  test('GET /api/tickets/:id - should return a specific ticket', async () => {
    const createRes = await request(app).post('/api/tickets').send(validTicket);
    const ticketId = createRes.body.ticket.id;

    const getRes = await request(app).get(`/api/tickets/${ticketId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.ticket.id).toBe(ticketId);
  });

  test('GET /api/tickets/:id - should return 404 for non-existent ticket', async () => {
    const response = await request(app).get('/api/tickets/invalid_id_12345');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test('PUT /api/tickets/:id - should update a ticket', async () => {
    const createRes = await request(app).post('/api/tickets').send(validTicket);
    const ticketId = createRes.body.ticket.id;

    const updateRes = await request(app)
      .put(`/api/tickets/${ticketId}`)
      .send({ status: 'in_progress', assigned_to: 'support_team' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.ticket.status).toBe('in_progress');
    expect(updateRes.body.ticket.assigned_to).toBe('support_team');
  });

  test('PUT /api/tickets/:id - should return 404 for non-existent ticket', async () => {
    const response = await request(app)
      .put('/api/tickets/invalid_id')
      .send({ status: 'resolved' });

    expect(response.status).toBe(404);
  });

  test('DELETE /api/tickets/:id - should delete a ticket', async () => {
    const createRes = await request(app).post('/api/tickets').send(validTicket);
    const ticketId = createRes.body.ticket.id;

    const deleteRes = await request(app).delete(`/api/tickets/${ticketId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // Verify ticket is deleted
    const getRes = await request(app).get(`/api/tickets/${ticketId}`);
    expect(getRes.status).toBe(404);
  });

  test('DELETE /api/tickets/:id - should return 404 for non-existent ticket', async () => {
    const response = await request(app).delete('/api/tickets/invalid_id');
    expect(response.status).toBe(404);
  });
});
