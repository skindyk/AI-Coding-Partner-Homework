const request = require('supertest');
const app = require('../src/app');
const fs = require('fs');
const path = require('path');

describe('Performance & Benchmark Tests', () => {
  const validTicket = {
    customer_id: 'cust_001',
    customer_email: 'user@example.com',
    customer_name: 'Performance Test User',
    subject: 'Performance test ticket',
    description: 'This ticket is used for performance and benchmark testing of the system'
  };

  test('Single ticket creation performance - should respond within 100ms', async () => {
    const start = Date.now();
    const res = await request(app)
      .post('/api/tickets')
      .send(validTicket);
    const duration = Date.now() - start;

    expect(res.status).toBe(201);
    expect(duration).toBeLessThan(100);
  });

  test('Bulk import 50 tickets performance - should complete within 2000ms', async () => {
    const csvPath = path.join(__dirname, 'fixtures', 'sample_tickets.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const start = Date.now();
    
    const res = await request(app)
      .post('/api/tickets/import')
      .send({ file_content: fileContent, file_type: 'csv' });
    
    const duration = Date.now() - start;

    expect(res.status).toBe(207);
    expect(res.body.summary.total).toBe(50);
    expect(duration).toBeLessThan(2000);
  });

  test('Auto-classification performance - should classify within 50ms', async () => {
    // Create a ticket first
    const createRes = await request(app)
      .post('/api/tickets')
      .send(validTicket);

    const ticketId = createRes.body.ticket.id;

    // Measure classification time
    const start = Date.now();
    const classifyRes = await request(app)
      .post(`/api/tickets/${ticketId}/auto-classify`)
      .send();
    const duration = Date.now() - start;

    expect(classifyRes.status).toBe(200);
    expect(duration).toBeLessThan(50);
  });

  test('Concurrent requests handling - 20 simultaneous ticket creations', async () => {
    const start = Date.now();
    const promises = [];

    for (let i = 0; i < 20; i++) {
      const ticket = {
        ...validTicket,
        customer_id: `cust_${i}`,
        customer_email: `user${i}@example.com`,
        subject: `Concurrent test ticket ${i}`
      };

      promises.push(
        request(app)
          .post('/api/tickets')
          .send(ticket)
      );
    }

    const results = await Promise.all(promises);
    const duration = Date.now() - start;

    expect(results.every(res => res.status === 201)).toBe(true);
    expect(duration).toBeLessThan(5000);
  });

  test('List and filter performance - should retrieve 50+ tickets within 200ms', async () => {
    // First, create multiple tickets for listing
    const csvPath = path.join(__dirname, 'fixtures', 'sample_tickets.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    await request(app)
      .post('/api/tickets/import')
      .send({ file_content: fileContent, file_type: 'csv' });

    const start = Date.now();
    const res = await request(app)
      .get('/api/tickets?limit=50&priority=high&category=technical_issue');
    
    const duration = Date.now() - start;

    expect(res.status).toBe(200);
    expect(res.body.tickets).toBeDefined();
    expect(duration).toBeLessThan(200);
  });
});
