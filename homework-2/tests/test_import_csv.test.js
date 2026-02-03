const FileImporter = require('../src/FileImporter');

describe('CSV Import', () => {
  test('should import valid CSV data', async () => {
    const csvContent = `customer_id,customer_email,customer_name,subject,description,category,priority
cust_001,john@test.com,John Doe,Login Problem,I cannot access my account for several days,account_access,high
cust_002,jane@test.com,Jane Smith,Billing Issue,I was charged twice this month,billing_question,medium`;

    const results = await FileImporter.importCSV(csvContent);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].success).toBe(true);
  });

  test('should handle CSV with tags', async () => {
    const csvContent = `customer_id,customer_email,customer_name,subject,description,category,priority,tags
cust_001,john@test.com,John Doe,Login Problem,I cannot access my account for several days,account_access,high,urgent;account
cust_002,jane@test.com,Jane Smith,Bug Report,The app crashes when uploading files,technical_issue,high,crash;bug`;

    const results = await FileImporter.importCSV(csvContent);
    expect(results[0].success).toBe(true);
    expect(Array.isArray(results[0].ticket.tags)).toBe(true);
  });

  test('should handle invalid CSV record', async () => {
    const csvContent = `customer_id,customer_email,customer_name,subject,description,category,priority
cust_001,invalid_email,John Doe,Subject,Short desc,account_access,high`;

    const results = await FileImporter.importCSV(csvContent);
    expect(results.some(r => !r.success)).toBe(true);
  });

  test('should skip header row and process data rows', async () => {
    const csvContent = `customer_id,customer_email,customer_name,subject,description,category,priority
cust_001,john@test.com,John Doe,Login Problem,I cannot access my account for several days,account_access,high
cust_002,jane@test.com,Jane Smith,Billing Issue,I was charged twice this month and need a refund,billing_question,medium
cust_003,bob@test.com,Bob Johnson,Feature Request,Would like dark mode support in the application,feature_request,low`;

    const results = await FileImporter.importCSV(csvContent);
    expect(results.length).toBe(3); // 3 data rows (excluding header)
  });

  test('should handle CSV with metadata JSON', async () => {
    const csvContent = `customer_id,customer_email,customer_name,subject,description,category,priority,metadata
cust_001,john@test.com,John Doe,Login Issue,Cannot access account,account_access,high,"{""source"":""web_form"",""browser"":""Chrome"",""device_type"":""desktop""}"`;

    const results = await FileImporter.importCSV(csvContent);
    expect(results.length).toBeGreaterThan(0);
  });

  test('should return error for malformed CSV', async () => {
    const csvContent = 'invalid,csv,without,proper,structure\n';
    
    try {
      await FileImporter.importCSV(csvContent);
    } catch (error) {
      expect(error.status).toBe(400);
      expect(error.message).toContain('CSV');
    }
  });
});
