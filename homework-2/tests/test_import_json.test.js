const FileImporter = require('../src/FileImporter');

describe('JSON Import', () => {
  test('should import valid JSON array', async () => {
    const jsonContent = JSON.stringify([
      {
        customer_id: 'cust_001',
        customer_email: 'john@test.com',
        customer_name: 'John Doe',
        subject: 'Login Problem',
        description: 'I cannot access my account for several days due to password issues',
        category: 'account_access',
        priority: 'high'
      },
      {
        customer_id: 'cust_002',
        customer_email: 'jane@test.com',
        customer_name: 'Jane Smith',
        subject: 'Billing Issue',
        description: 'I was charged twice for my subscription this month and need a refund',
        category: 'billing_question',
        priority: 'medium'
      }
    ]);

    const results = await FileImporter.importJSON(jsonContent);
    expect(results.length).toBe(2);
    expect(results[0].success).toBe(true);
  });

  test('should import single JSON object', async () => {
    const jsonContent = JSON.stringify({
      customer_id: 'cust_001',
      customer_email: 'john@test.com',
      customer_name: 'John Doe',
      subject: 'Technical Issue',
      description: 'The application keeps crashing when I try to upload documents to my account',
      category: 'technical_issue',
      priority: 'high'
    });

    const results = await FileImporter.importJSON(jsonContent);
    expect(results.length).toBe(1);
    expect(results[0].success).toBe(true);
  });

  test('should handle invalid JSON with invalid email', async () => {
    const jsonContent = JSON.stringify({
      customer_id: 'cust_001',
      customer_email: 'invalid_email',
      customer_name: 'John Doe',
      subject: 'Some Issue',
      description: 'This is a test description for validation testing'
    });

    const results = await FileImporter.importJSON(jsonContent);
    expect(results[0].success).toBe(false);
  });

  test('should handle JSON with tags array', async () => {
    const jsonContent = JSON.stringify([
      {
        customer_id: 'cust_001',
        customer_email: 'john@test.com',
        customer_name: 'John Doe',
        subject: 'Critical Issue',
        description: 'Production system is down and impacting all users of our platform',
        category: 'technical_issue',
        priority: 'urgent',
        tags: ['critical', 'production', 'urgent']
      }
    ]);

    const results = await FileImporter.importJSON(jsonContent);
    expect(results[0].success).toBe(true);
    expect(Array.isArray(results[0].ticket.tags)).toBe(true);
  });

  test('should handle JSON with metadata object', async () => {
    const jsonContent = JSON.stringify({
      customer_id: 'cust_001',
      customer_email: 'john@test.com',
      customer_name: 'John Doe',
      subject: 'Login Problem',
      description: 'Cannot login on mobile device after recent app update',
      category: 'account_access',
      priority: 'high',
      metadata: {
        source: 'api',
        browser: 'Safari',
        device_type: 'mobile'
      }
    });

    const results = await FileImporter.importJSON(jsonContent);
    expect(results[0].success).toBe(true);
    expect(results[0].ticket.metadata.device_type).toBe('mobile');
  });

  test('should reject malformed JSON', async () => {
    const jsonContent = 'invalid json {] content';

    try {
      await FileImporter.importJSON(jsonContent);
      expect(true).toBe(false); // Should throw
    } catch (error) {
      expect(error.status).toBe(400);
      expect(error.message).toContain('JSON');
    }
  });
});
