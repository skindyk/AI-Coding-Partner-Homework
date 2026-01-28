const FileImporter = require('../src/FileImporter');

describe('XML Import', () => {
  test('should import valid XML data', async () => {
    const xmlContent = `<?xml version="1.0"?>
<tickets>
  <ticket>
    <customer_id>cust_001</customer_id>
    <customer_email>john@test.com</customer_email>
    <customer_name>John Doe</customer_name>
    <subject>Login Problem</subject>
    <description>I cannot access my account for several days and need immediate assistance</description>
    <category>account_access</category>
    <priority>high</priority>
  </ticket>
  <ticket>
    <customer_id>cust_002</customer_id>
    <customer_email>jane@test.com</customer_email>
    <customer_name>Jane Smith</customer_name>
    <subject>Billing Issue</subject>
    <description>I was charged twice for my subscription this month and need this resolved immediately</description>
    <category>billing_question</category>
    <priority>medium</priority>
  </ticket>
</tickets>`;

    const results = await FileImporter.importXML(xmlContent);
    expect(results.length).toBe(2);
    expect(results[0].success).toBe(true);
  });

  test('should handle XML with tags', async () => {
    const xmlContent = `<?xml version="1.0"?>
<tickets>
  <ticket>
    <customer_id>cust_001</customer_id>
    <customer_email>john@test.com</customer_email>
    <customer_name>John Doe</customer_name>
    <subject>App Crash Issue</subject>
    <description>The application crashes every time I try to upload a file larger than 100MB</description>
    <category>bug_report</category>
    <priority>high</priority>
    <tags>
      <tag>crash</tag>
      <tag>upload</tag>
      <tag>file-handling</tag>
    </tags>
  </ticket>
</tickets>`;

    const results = await FileImporter.importXML(xmlContent);
    expect(results[0].success).toBe(true);
  });

  test('should handle XML with metadata', async () => {
    const xmlContent = `<?xml version="1.0"?>
<tickets>
  <ticket>
    <customer_id>cust_001</customer_id>
    <customer_email>john@test.com</customer_email>
    <customer_name>John Doe</customer_name>
    <subject>Mobile App Issue</subject>
    <description>The app is extremely slow on my mobile device and takes forever to load</description>
    <category>technical_issue</category>
    <priority>medium</priority>
    <metadata>
      <source>mobile_app</source>
      <browser>Safari</browser>
      <device_type>mobile</device_type>
    </metadata>
  </ticket>
</tickets>`;

    const results = await FileImporter.importXML(xmlContent);
    expect(results[0].success).toBe(true);
  });

  test('should reject invalid XML format', async () => {
    const xmlContent = '<invalid xml without closing tags';

    try {
      await FileImporter.importXML(xmlContent);
      expect(true).toBe(false); // Should throw
    } catch (error) {
      expect(error.status).toBe(400);
      expect(error.message).toContain('XML');
    }
  });

  test('should handle XML with validation errors', async () => {
    const xmlContent = `<?xml version="1.0"?>
<tickets>
  <ticket>
    <customer_id>cust_001</customer_id>
    <customer_email>invalid-email</customer_email>
    <customer_name>John Doe</customer_name>
    <subject>Test Issue</subject>
    <description>Short desc</description>
    <category>technical_issue</category>
    <priority>high</priority>
  </ticket>
</tickets>`;

    const results = await FileImporter.importXML(xmlContent);
    expect(results[0].success).toBe(false);
  });
});
