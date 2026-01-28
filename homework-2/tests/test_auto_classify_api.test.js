const request = require('supertest');
const app = require('../src/app');

describe('Auto-Classification API', () => {
  const validTicket = {
    customer_id: 'class_001',
    customer_email: 'user@example.com',
    customer_name: 'Test User',
    subject: 'Cannot access my account',
    description: 'I cannot login and the password reset is not working properly'
  };

  test('POST /api/tickets/:id/auto-classify - should classify and return confidence', async () => {
    const createRes = await request(app)
      .post('/api/tickets')
      .send(validTicket);

    const ticketId = createRes.body.ticket.id;

    const classifyRes = await request(app)
      .post(`/api/tickets/${ticketId}/auto-classify`)
      .send();

    expect(classifyRes.status).toBe(200);
    expect(classifyRes.body.success).toBe(true);
    expect(classifyRes.body.classification).toBeDefined();
    expect(classifyRes.body.classification.category).toBeDefined();
    expect(classifyRes.body.classification.priority).toBeDefined();
    expect(classifyRes.body.classification.confidence).toBeDefined();
    expect(classifyRes.body.classification.reasoning).toBeDefined();
    expect(classifyRes.body.classification.keywords_found).toBeDefined();
  });

  test('POST /api/tickets/:id/auto-classify - should update ticket with classification', async () => {
    const createRes = await request(app)
      .post('/api/tickets')
      .send(validTicket);

    const ticketId = createRes.body.ticket.id;

    await request(app)
      .post(`/api/tickets/${ticketId}/auto-classify`)
      .send();

    const getRes = await request(app).get(`/api/tickets/${ticketId}`);

    expect(getRes.body.ticket.classification_confidence).toBeDefined();
    expect(getRes.body.ticket.classification_reasoning).toBeDefined();
  });

  test('POST /api/tickets/:id/auto-classify - should return 404 for non-existent ticket', async () => {
    const response = await request(app)
      .post('/api/tickets/invalid_id_12345/auto-classify')
      .send();

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test('POST /api/tickets/:id/auto-classify - should detect account_access category', async () => {
    const ticket = {
      ...validTicket,
      subject: 'Login issue',
      description: 'I cannot access my account. The login is failing.'
    };

    const createRes = await request(app)
      .post('/api/tickets')
      .send(ticket);

    const classifyRes = await request(app)
      .post(`/api/tickets/${createRes.body.ticket.id}/auto-classify`)
      .send();

    expect(classifyRes.body.classification.category).toBe('account_access');
  });

  test('POST /api/tickets/:id/auto-classify - should detect billing_question category', async () => {
    const ticket = {
      ...validTicket,
      subject: 'Payment issue',
      description: 'I was charged twice for my subscription. Please refund the extra charge.'
    };

    const createRes = await request(app)
      .post('/api/tickets')
      .send(ticket);

    const classifyRes = await request(app)
      .post(`/api/tickets/${createRes.body.ticket.id}/auto-classify`)
      .send();

    expect(classifyRes.body.classification.category).toBe('billing_question');
  });

  test('POST /api/tickets/:id/auto-classify - should detect technical_issue category', async () => {
    const ticket = {
      ...validTicket,
      subject: 'System error',
      description: 'The app is crashing and throwing an exception'
    };

    const createRes = await request(app)
      .post('/api/tickets')
      .send(ticket);

    const classifyRes = await request(app)
      .post(`/api/tickets/${createRes.body.ticket.id}/auto-classify`)
      .send();

    expect(classifyRes.body.classification.category).toBe('technical_issue');
  });

  test('POST /api/tickets/:id/auto-classify - should return keywords found', async () => {
    const ticket = {
      ...validTicket,
      subject: 'Login problem',
      description: 'Cannot login to account'
    };

    const createRes = await request(app)
      .post('/api/tickets')
      .send(ticket);

    const classifyRes = await request(app)
      .post(`/api/tickets/${createRes.body.ticket.id}/auto-classify`)
      .send();

    expect(Array.isArray(classifyRes.body.classification.keywords_found)).toBe(true);
  });
});
