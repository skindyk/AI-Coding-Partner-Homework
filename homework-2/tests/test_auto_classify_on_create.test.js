const request = require('supertest');
const app = require('../src/app');

describe('Auto-Classify on Creation', () => {
  const validTicket = {
    customer_id: 'auto_cust_001',
    customer_email: 'user@example.com',
    customer_name: 'Auto Test User',
    subject: 'Cannot login to account',
    description: 'I am having trouble logging in to my account and need help resetting my password'
  };

  test('POST /api/tickets with auto_classify=true should classify ticket on creation', async () => {
    const response = await request(app)
      .post('/api/tickets?auto_classify=true')
      .send(validTicket);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.classification).toBeDefined();
    expect(response.body.classification.category).toBe('account_access');
    expect(response.body.ticket.category).toBe('account_access');
  });

  test('POST /api/tickets without auto_classify flag should not classify', async () => {
    const response = await request(app)
      .post('/api/tickets')
      .send(validTicket);

    expect(response.status).toBe(201);
    expect(response.body.classification).toBeUndefined();
    expect(response.body.ticket.category).toBe('other');
  });

  test('POST /api/tickets with auto_classify=false should not classify', async () => {
    const response = await request(app)
      .post('/api/tickets?auto_classify=false')
      .send(validTicket);

    expect(response.status).toBe(201);
    expect(response.body.classification).toBeUndefined();
  });

  test('Should auto-classify technical issue on creation', async () => {
    const ticket = {
      ...validTicket,
      subject: 'System crash',
      description: 'The application keeps crashing with an exception when I try to upload files'
    };

    const response = await request(app)
      .post('/api/tickets?auto_classify=true')
      .send(ticket);

    expect(response.body.classification.category).toBe('technical_issue');
  });

  test('Should auto-classify billing question on creation', async () => {
    const ticket = {
      ...validTicket,
      subject: 'Double charge',
      description: 'I was charged twice for my subscription this month. Please refund the extra charge.'
    };

    const response = await request(app)
      .post('/api/tickets?auto_classify=true')
      .send(ticket);

    expect(response.body.classification.category).toBe('billing_question');
  });

  test('Should auto-classify and set correct priority on creation', async () => {
    const ticket = {
      ...validTicket,
      subject: 'Critical production down',
      description: 'The production system is down and affecting all customers. This is urgent!'
    };

    const response = await request(app)
      .post('/api/tickets?auto_classify=true')
      .send(ticket);

    expect(response.body.classification.priority).toBe('urgent');
    expect(response.body.ticket.priority).toBe('urgent');
  });

  test('Auto-classified ticket should include confidence and reasoning', async () => {
    const ticket = {
      ...validTicket,
      subject: 'Feature request',
      description: 'Can you add dark mode to the application?'
    };

    const response = await request(app)
      .post('/api/tickets?auto_classify=true')
      .send(ticket);

    expect(response.body.classification.confidence).toBeDefined();
    expect(typeof response.body.classification.confidence).toBe('number');
    expect(response.body.classification.confidence).toBeGreaterThanOrEqual(0);
    expect(response.body.classification.confidence).toBeLessThanOrEqual(1);
    expect(response.body.classification.reasoning).toBeDefined();
  });

  test('Auto-classified ticket should include keywords found', async () => {
    const ticket = {
      ...validTicket,
      subject: 'Bug in checkout',
      description: 'There is a defect in the checkout process that is preventing purchases'
    };

    const response = await request(app)
      .post('/api/tickets?auto_classify=true')
      .send(ticket);

    expect(Array.isArray(response.body.classification.keywords_found)).toBe(true);
  });
});
