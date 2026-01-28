const request = require('supertest');
const app = require('../src/app');

describe('Bulk Import API', () => {
  const validJSONImport = JSON.stringify([
    {
      customer_id: 'bulk_001',
      customer_email: 'user1@test.com',
      customer_name: 'User One',
      subject: 'First bulk ticket',
      description: 'This is the first ticket in a bulk import operation'
    },
    {
      customer_id: 'bulk_002',
      customer_email: 'user2@test.com',
      customer_name: 'User Two',
      subject: 'Second bulk ticket',
      description: 'This is the second ticket in a bulk import operation'
    }
  ]);

  test('POST /api/tickets/import with JSON - should import multiple tickets', async () => {
    const response = await request(app)
      .post('/api/tickets/import')
      .send({ file_content: validJSONImport, file_type: 'json' });

    expect(response.status).toBe(207);
    expect(response.body.success).toBe(true);
    expect(response.body.summary.successful).toBeGreaterThan(0);
  });

  test('POST /api/tickets/import - should return summary with failed records', async () => {
    const mixedData = JSON.stringify([
      {
        customer_id: 'bulk_001',
        customer_email: 'valid@test.com',
        customer_name: 'Valid User',
        subject: 'Valid ticket',
        description: 'This is a valid ticket for bulk import testing'
      },
      {
        customer_id: 'bulk_002',
        customer_email: 'invalid_email',
        customer_name: 'Invalid User',
        subject: 'Invalid ticket',
        description: 'Invalid'  // Too short
      }
    ]);

    const response = await request(app)
      .post('/api/tickets/import')
      .send({ file_content: mixedData, file_type: 'json' });

    expect(response.status).toBe(207);
    expect(response.body.summary.failed).toBeGreaterThan(0);
    expect(response.body.failed_records.length).toBeGreaterThan(0);
  });

  test('POST /api/tickets/import - should require file_content', async () => {
    const response = await request(app)
      .post('/api/tickets/import')
      .send({ file_type: 'json' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('POST /api/tickets/import - should require file_type', async () => {
    const response = await request(app)
      .post('/api/tickets/import')
      .send({ file_content: validJSONImport });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('POST /api/tickets/import - should handle CSV format', async () => {
    const csvContent = `customer_id,customer_email,customer_name,subject,description
bulk_001,user1@test.com,User One,CSV Import Test,This is a test ticket imported from CSV format
bulk_002,user2@test.com,User Two,Another CSV Import,Another ticket imported from CSV`;

    const response = await request(app)
      .post('/api/tickets/import')
      .send({ file_content: csvContent, file_type: 'csv' });

    expect(response.status).toBe(207);
    expect(response.body.summary.successful).toBeGreaterThan(0);
  });

  test('POST /api/tickets/import - should handle XML format', async () => {
    const xmlContent = `<?xml version="1.0"?>
<tickets>
  <ticket>
    <customer_id>bulk_001</customer_id>
    <customer_email>user1@test.com</customer_email>
    <customer_name>User One</customer_name>
    <subject>XML Import Test</subject>
    <description>This is a test ticket imported from XML format</description>
  </ticket>
</tickets>`;

    const response = await request(app)
      .post('/api/tickets/import')
      .send({ file_content: xmlContent, file_type: 'xml' });

    expect(response.status).toBe(207);
    expect(response.body.summary.successful).toBeGreaterThan(0);
  });

  test('POST /api/tickets/import - should reject unsupported file type', async () => {
    const response = await request(app)
      .post('/api/tickets/import')
      .send({ file_content: 'some content', file_type: 'yaml' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
