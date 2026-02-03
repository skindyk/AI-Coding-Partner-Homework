const request = require('supertest');
const app = require('../src/app');

describe('Integration & Performance Tests', () => {
  const validTicket = {
    customer_id: 'cust_001',
    customer_email: 'user@example.com',
    customer_name: 'Integration Test User',
    subject: 'Complete workflow test',
    description: 'This ticket is used for testing the complete lifecycle workflow of the system'
  };

  test('Complete ticket lifecycle workflow', async () => {
    // 1. Create ticket
    const createRes = await request(app)
      .post('/api/tickets')
      .send(validTicket);

    expect(createRes.status).toBe(201);
    const ticketId = createRes.body.ticket.id;
    expect(createRes.body.ticket.status).toBe('new');

    // 2. Auto-classify ticket
    const classifyRes = await request(app)
      .post(`/api/tickets/${ticketId}/auto-classify`)
      .send();

    expect(classifyRes.status).toBe(200);
    expect(classifyRes.body.classification.category).toBeDefined();
    expect(classifyRes.body.classification.confidence).toBeDefined();

    // 3. Update ticket status to in_progress
    const updateRes1 = await request(app)
      .put(`/api/tickets/${ticketId}`)
      .send({ status: 'in_progress', assigned_to: 'support_team' });

    expect(updateRes1.status).toBe(200);
    expect(updateRes1.body.ticket.status).toBe('in_progress');
    expect(updateRes1.body.ticket.assigned_to).toBe('support_team');

    // 4. Update ticket status to resolved
    const updateRes2 = await request(app)
      .put(`/api/tickets/${ticketId}`)
      .send({ status: 'resolved' });

    expect(updateRes2.status).toBe(200);
    expect(updateRes2.body.ticket.status).toBe('resolved');
    expect(updateRes2.body.ticket.resolved_at).toBeDefined();

    // 5. Verify ticket state
    const getRes = await request(app).get(`/api/tickets/${ticketId}`);
    expect(getRes.body.ticket.status).toBe('resolved');
  });

  test('Bulk import with auto-classification verification', async () => {
    const jsonContent = JSON.stringify([
      {
        customer_id: 'cust_001',
        customer_email: 'john@test.com',
        customer_name: 'John Doe',
        subject: 'Cannot access my account',
        description: 'I cannot login and the password reset is not working'
      },
      {
        customer_id: 'cust_002',
        customer_email: 'jane@test.com',
        customer_name: 'Jane Smith',
        subject: 'Charged twice for subscription',
        description: 'I was charged twice this month and need a refund'
      }
    ]);

    // Import tickets
    const importRes = await request(app)
      .post('/api/tickets/import')
      .send({ file_content: jsonContent, file_type: 'json' });

    expect(importRes.status).toBe(207);
    expect(importRes.body.summary.successful).toBe(2);
    expect(importRes.body.summary.failed).toBe(0);

    // Verify tickets exist
    const listRes = await request(app).get('/api/tickets');
    expect(listRes.body.count).toBeGreaterThanOrEqual(2);
  });

  test('Concurrent operations - 20+ simultaneous requests', async () => {
    const requests = [];

    // Create 20 concurrent requests
    for (let i = 0; i < 20; i++) {
      const ticket = {
        ...validTicket,
        customer_id: `cust_${i}`,
        customer_email: `user${i}@example.com`
      };

      requests.push(
        request(app)
          .post('/api/tickets')
          .send(ticket)
      );
    }

    const results = await Promise.all(requests);

    // Verify all requests succeeded
    results.forEach(result => {
      expect(result.status).toBe(201);
      expect(result.body.success).toBe(true);
    });

    // Verify all tickets were created
    const listRes = await request(app).get('/api/tickets');
    expect(listRes.body.count).toBeGreaterThanOrEqual(20);
  });

  test('Combined filtering by category and priority', async () => {
    // Create tickets with different categories and priorities
    const ticket1 = {
      customer_id: 'cust_filter_1',
      customer_email: 'filter1@test.com',
      customer_name: 'Test User 1',
      category: 'technical_issue',
      priority: 'high',
      subject: 'System Error',
      description: 'The system is throwing errors and needs immediate attention'
    };

    const ticket2 = {
      customer_id: 'cust_filter_2',
      customer_email: 'filter2@test.com',
      customer_name: 'Test User 2',
      category: 'billing_question',
      priority: 'high',
      subject: 'Invoice Not Received',
      description: 'I have not received my monthly invoice for payment'
    };

    const ticket3 = {
      customer_id: 'cust_filter_3',
      customer_email: 'filter3@test.com',
      customer_name: 'Test User 3',
      category: 'technical_issue',
      priority: 'medium',
      subject: 'Minor Issue',
      description: 'Just a minor issue with the user interface display'
    };

    // Create all tickets
    await request(app).post('/api/tickets').send(ticket1);
    await request(app).post('/api/tickets').send(ticket2);
    await request(app).post('/api/tickets').send(ticket3);

    // Filter by category=technical_issue AND priority=high
    const filterRes = await request(app)
      .get('/api/tickets')
      .query({ category: 'technical_issue', priority: 'high' });

    expect(filterRes.status).toBe(200);
    // Verify tickets that match the filter
    const matching = filterRes.body.tickets.filter(t => 
      t.category === 'technical_issue' && t.priority === 'high'
    );
    expect(matching.length).toBeGreaterThanOrEqual(1);
  });

  test('Performance: Response time for large dataset retrieval', async () => {
    // Create 50 tickets
    for (let i = 0; i < 50; i++) {
      await request(app).post('/api/tickets').send({
        ...validTicket,
        customer_id: `perf_cust_${i}`,
        customer_email: `perf${i}@test.com`
      });
    }

    // Measure retrieval time
    const startTime = Date.now();
    const getRes = await request(app).get('/api/tickets');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(getRes.status).toBe(200);
    expect(responseTime).toBeLessThan(1000); // Should respond in less than 1 second
    expect(getRes.body.count).toBeGreaterThanOrEqual(50);
  });
});
