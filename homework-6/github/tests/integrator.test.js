const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Integrator Integration Test', () => {
  let tmpDir;
  let integrator;

  beforeAll(() => {
    // Create a temporary directory for test execution
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pipeline-test-'));
    process.env.SHARED_DIR = tmpDir;
    
    // Load integrator after setting env var
    integrator = require('../src/integrator');
  });

  afterAll(() => {
    // Clean up temp directory after tests
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    delete process.env.SHARED_DIR;
  });

  describe('Directory Structure Initialization', () => {
    it('should create input directory', () => {
      integrator.initializeDirectories();
      const inputDir = path.join(tmpDir, 'input');
      expect(fs.existsSync(inputDir)).toBe(true);
    });

    it('should create processing directory', () => {
      const processingDir = path.join(tmpDir, 'processing');
      expect(fs.existsSync(processingDir)).toBe(true);
    });

    it('should create output directory', () => {
      const outputDir = path.join(tmpDir, 'output');
      expect(fs.existsSync(outputDir)).toBe(true);
    });

    it('should create results directory', () => {
      const resultsDir = path.join(tmpDir, 'results');
      expect(fs.existsSync(resultsDir)).toBe(true);
    });
  });

  describe('Pipeline Execution', () => {
    beforeEach(() => {
      // Clear directories before each test
      const dirs = ['input', 'processing', 'output', 'results'];
      for (const dir of dirs) {
        const dirPath = path.join(tmpDir, dir);
        if (fs.existsSync(dirPath)) {
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      }
      // Re-initialize directories
      integrator.initializeDirectories();
    });

    it('should process a valid transaction end-to-end', () => {
      const transaction = {
        transaction_id: 'TXN-TEST-001',
        timestamp: '2026-03-16T09:00:00Z',
        source_account: 'ACC-1001',
        destination_account: 'ACC-2001',
        amount: '1500.00',
        currency: 'USD',
        transaction_type: 'transfer',
        description: 'Test Transaction',
        metadata: {
          channel: 'online',
          country: 'US'
        }
      };

      const result = integrator.processTransaction(transaction);
      
      expect(result.data.transaction_id).toBe('TXN-TEST-001');
      expect(result.data.status).toBe('approved');
      expect(result.data.message_id).toBeDefined();
      expect(result.data.agent_chain).toBeDefined();
    });

    it('should reject transaction with invalid currency', () => {
      const transaction = {
        transaction_id: 'TXN-INVALID-CURR',
        timestamp: '2026-03-16T09:00:00Z',
        source_account: 'ACC-1001',
        destination_account: 'ACC-2001',
        amount: '200.00',
        currency: 'XYZ',
        transaction_type: 'transfer',
        description: 'Invalid Currency Test',
        metadata: {
          channel: 'online',
          country: 'US'
        }
      };

      const result = integrator.processTransaction(transaction);
      
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('INVALID_CURRENCY');
    });

    it('should reject transaction with negative amount', () => {
      const transaction = {
        transaction_id: 'TXN-NEG-AMOUNT',
        timestamp: '2026-03-16T09:00:00Z',
        source_account: 'ACC-1001',
        destination_account: 'ACC-2001',
        amount: '-100.00',
        currency: 'GBP',
        transaction_type: 'refund',
        description: 'Negative Amount Test',
        metadata: {
          channel: 'online',
          country: 'GB'
        }
      };

      const result = integrator.processTransaction(transaction);
      
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('INVALID_AMOUNT');
    });

    it('should process HIGH risk wire transfer', () => {
      const transaction = {
        transaction_id: 'TXN-HIGH-RISK',
        timestamp: '2026-03-16T10:00:00Z',
        source_account: 'ACC-1005',
        destination_account: 'ACC-6600',
        amount: '75000.00',
        currency: 'USD',
        transaction_type: 'wire_transfer',
        description: 'Large Wire Transfer',
        metadata: {
          channel: 'branch',
          country: 'US'
        }
      };

      const result = integrator.processTransaction(transaction);
      
      expect(result.data.status).toBe('approved');
      expect(result.data.fraud_risk_level).toBe('HIGH');
      expect(result.data.ctr_required).toBe(true);
      expect(Array.isArray(result.data.compliance_notes)).toBe(true);
    });

    it('should detect watchlist account', () => {
      const transaction = {
        transaction_id: 'TXN-WATCHLIST',
        timestamp: '2026-03-16T09:30:00Z',
        source_account: 'ACC-1003',
        destination_account: 'ACC-9999',
        amount: '9999.99',
        currency: 'USD',
        transaction_type: 'transfer',
        description: 'Watchlist Test',
        metadata: {
          channel: 'online',
          country: 'US'
        }
      };

      const result = integrator.processTransaction(transaction);
      
      expect(result.data.status).toBe('approved');
      expect(result.data.fraud_risk_level).toBe('MEDIUM');
      expect(result.data.fraud_risk_score).toBe(5);
    });

    it('should detect unusual hour + cross-border', () => {
      const transaction = {
        transaction_id: 'TXN-UNUSUAL',
        timestamp: '2026-03-16T02:47:00Z',
        source_account: 'ACC-1004',
        destination_account: 'ACC-5500',
        amount: '500.00',
        currency: 'EUR',
        transaction_type: 'transfer',
        description: 'Unusual Hour Test',
        metadata: {
          channel: 'api',
          country: 'DE'
        }
      };

      const result = integrator.processTransaction(transaction);
      
      expect(result.data.status).toBe('approved');
      expect(result.data.fraud_risk_level).toBe('MEDIUM');
      expect(result.data.fraud_risk_score).toBe(3);
    });
  });

  describe('Result File Structure', () => {
    beforeEach(() => {
      // Clear directories before each test
      const dirs = ['input', 'processing', 'output', 'results'];
      for (const dir of dirs) {
        const dirPath = path.join(tmpDir, dir);
        if (fs.existsSync(dirPath)) {
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      }
      // Re-initialize directories
      integrator.initializeDirectories();
    });

    it('should create result file with message_id', () => {
      const transaction = {
        transaction_id: 'TXN-FILE-001',
        timestamp: '2026-03-16T09:00:00Z',
        source_account: 'ACC-1001',
        destination_account: 'ACC-2001',
        amount: '1500.00',
        currency: 'USD',
        transaction_type: 'transfer',
        description: 'File Test',
        metadata: { channel: 'online', country: 'US' }
      };

      const result = integrator.processTransaction(transaction);
      
      expect(result.data.message_id).toBeDefined();
      expect(typeof result.data.message_id).toBe('string');
    });

    it('should create result file with transaction_id', () => {
      const transaction = {
        transaction_id: 'TXN-FILE-002',
        timestamp: '2026-03-16T09:00:00Z',
        source_account: 'ACC-1001',
        destination_account: 'ACC-2001',
        amount: '1500.00',
        currency: 'USD',
        transaction_type: 'transfer',
        description: 'File Test',
        metadata: { channel: 'online', country: 'US' }
      };

      const result = integrator.processTransaction(transaction);
      
      expect(result.data.transaction_id).toBe('TXN-FILE-002');
    });

    it('should create result file with status', () => {
      const transaction = {
        transaction_id: 'TXN-FILE-003',
        timestamp: '2026-03-16T09:00:00Z',
        source_account: 'ACC-1001',
        destination_account: 'ACC-2001',
        amount: '1500.00',
        currency: 'USD',
        transaction_type: 'transfer',
        description: 'File Test',
        metadata: { channel: 'online', country: 'US' }
      };

      const result = integrator.processTransaction(transaction);
      
      expect(['approved', 'rejected']).toContain(result.data.status);
    });

    it('should include reason in rejected result', () => {
      const transaction = {
        transaction_id: 'TXN-FILE-REJECT',
        timestamp: '2026-03-16T09:00:00Z',
        source_account: 'ACC-1001',
        destination_account: 'ACC-2001',
        amount: '100.00',
        currency: 'XYZ',
        transaction_type: 'transfer',
        description: 'File Test Rejection',
        metadata: { channel: 'online', country: 'US' }
      };

      const result = integrator.processTransaction(transaction);
      
      if (result.data.status === 'rejected') {
        expect(result.data.reason).toBeDefined();
        expect(typeof result.data.reason).toBe('string');
      }
    });

    it('should include agent_chain in result', () => {
      const transaction = {
        transaction_id: 'TXN-FILE-CHAIN',
        timestamp: '2026-03-16T09:00:00Z',
        source_account: 'ACC-1001',
        destination_account: 'ACC-2001',
        amount: '1500.00',
        currency: 'USD',
        transaction_type: 'transfer',
        description: 'File Test Chain',
        metadata: { channel: 'online', country: 'US' }
      };

      const result = integrator.processTransaction(transaction);
      
      expect(Array.isArray(result.agent_chain)).toBe(true);
      expect(result.agent_chain.length).toBeGreaterThan(0);
      expect(result.agent_chain).toContain('integrator');
    });

    it('should include fraud assessment in approved transaction', () => {
      const transaction = {
        transaction_id: 'TXN-FILE-FRAUD',
        timestamp: '2026-03-16T09:00:00Z',
        source_account: 'ACC-1001',
        destination_account: 'ACC-2001',
        amount: '1500.00',
        currency: 'USD',
        transaction_type: 'transfer',
        description: 'File Test Fraud',
        metadata: { channel: 'online', country: 'US' }
      };

      const result = integrator.processTransaction(transaction);
      
      if (result.data.status === 'approved') {
        expect(result.data.fraud_risk_score).toBeDefined();
        expect(result.data.fraud_risk_level).toBeDefined();
      }
    });

    it('should mask account numbers in result file', () => {
      const transaction = {
        transaction_id: 'TXN-FILE-MASK',
        timestamp: '2026-03-16T09:00:00Z',
        source_account: 'ACC-1001',
        destination_account: 'ACC-2001',
        amount: '1500.00',
        currency: 'USD',
        transaction_type: 'transfer',
        description: 'File Test Masking',
        metadata: { channel: 'online', country: 'US' }
      };

      const result = integrator.processTransaction(transaction);
      
      if (result.data.source_account) {
        expect(result.data.source_account).toMatch(/^ACC-\*\*\*\*$/);
      }
      if (result.data.destination_account) {
        expect(result.data.destination_account).toMatch(/^ACC-\*\*\*\*$/);
      }
    });
  });

  describe('Complete Pipeline Run', () => {
    beforeEach(() => {
      // Clear directories before each test
      const dirs = ['input', 'processing', 'output', 'results'];
      for (const dir of dirs) {
        const dirPath = path.join(tmpDir, dir);
        if (fs.existsSync(dirPath)) {
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      }
      // Re-initialize directories
      integrator.initializeDirectories();
    });

    it('should process sample transaction TXN001 (LOW risk)', () => {
      const transaction = {
        transaction_id: 'TXN001',
        timestamp: '2026-03-16T09:00:00Z',
        source_account: 'ACC-1001',
        destination_account: 'ACC-2001',
        amount: '1500.00',
        currency: 'USD',
        transaction_type: 'transfer',
        description: 'Monthly rent payment',
        metadata: { channel: 'online', country: 'US' }
      };

      const result = integrator.processTransaction(transaction);
      expect(result.data.status).toBe('approved');
      expect(result.data.fraud_risk_level).toBe('LOW');
    });

    it('should process sample transaction TXN002 (MEDIUM risk + CTR)', () => {
      const transaction = {
        transaction_id: 'TXN002',
        timestamp: '2026-03-16T09:15:00Z',
        source_account: 'ACC-1002',
        destination_account: 'ACC-3001',
        amount: '25000.00',
        currency: 'USD',
        transaction_type: 'wire_transfer',
        description: 'Equipment purchase',
        metadata: { channel: 'branch', country: 'US' }
      };

      const result = integrator.processTransaction(transaction);
      expect(result.data.status).toBe('approved');
      expect(result.data.fraud_risk_level).toBe('MEDIUM');
      expect(result.data.ctr_required).toBe(true);
    });

    it('should process sample transaction TXN003 (watchlist)', () => {
      const transaction = {
        transaction_id: 'TXN003',
        timestamp: '2026-03-16T09:30:00Z',
        source_account: 'ACC-1003',
        destination_account: 'ACC-9999',
        amount: '9999.99',
        currency: 'USD',
        transaction_type: 'transfer',
        description: 'Consulting payment',
        metadata: { channel: 'online', country: 'US' }
      };

      const result = integrator.processTransaction(transaction);
      expect(result.data.status).toBe('approved');
      expect(result.data.fraud_risk_score).toBe(5);
    });

    it('should process sample transaction TXN004 (unusual hour + cross-border)', () => {
      const transaction = {
        transaction_id: 'TXN004',
        timestamp: '2026-03-16T02:47:00Z',
        source_account: 'ACC-1004',
        destination_account: 'ACC-5500',
        amount: '500.00',
        currency: 'EUR',
        transaction_type: 'transfer',
        description: 'Invoice #4471',
        metadata: { channel: 'api', country: 'DE' }
      };

      const result = integrator.processTransaction(transaction);
      expect(result.data.status).toBe('approved');
      expect(result.data.fraud_risk_score).toBe(3);
      expect(result.data.fraud_risk_level).toBe('MEDIUM');
    });

    it('should process sample transaction TXN005 (HIGH risk)', () => {
      const transaction = {
        transaction_id: 'TXN005',
        timestamp: '2026-03-16T10:00:00Z',
        source_account: 'ACC-1005',
        destination_account: 'ACC-6600',
        amount: '75000.00',
        currency: 'USD',
        transaction_type: 'wire_transfer',
        description: 'Property settlement',
        metadata: { channel: 'branch', country: 'US' }
      };

      const result = integrator.processTransaction(transaction);
      expect(result.data.status).toBe('approved');
      expect(result.data.fraud_risk_level).toBe('HIGH');
      expect(result.data.fraud_risk_score).toBe(7);
      expect(result.data.ctr_required).toBe(true);
    });

    it('should process sample transaction TXN006 (INVALID_CURRENCY)', () => {
      const transaction = {
        transaction_id: 'TXN006',
        timestamp: '2026-03-16T10:05:00Z',
        source_account: 'ACC-1006',
        destination_account: 'ACC-7700',
        amount: '200.00',
        currency: 'XYZ',
        transaction_type: 'transfer',
        description: 'Test payment',
        metadata: { channel: 'online', country: 'US' }
      };

      const result = integrator.processTransaction(transaction);
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('INVALID_CURRENCY');
    });

    it('should process sample transaction TXN007 (INVALID_AMOUNT)', () => {
      const transaction = {
        transaction_id: 'TXN007',
        timestamp: '2026-03-16T10:10:00Z',
        source_account: 'ACC-1007',
        destination_account: 'ACC-8800',
        amount: '-100.00',
        currency: 'GBP',
        transaction_type: 'refund',
        description: 'Refund for order #8821',
        metadata: { channel: 'online', country: 'GB' }
      };

      const result = integrator.processTransaction(transaction);
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('INVALID_AMOUNT');
    });

    it('should process sample transaction TXN008 (normal transfer)', () => {
      const transaction = {
        transaction_id: 'TXN008',
        timestamp: '2026-03-16T10:15:00Z',
        source_account: 'ACC-1008',
        destination_account: 'ACC-9900',
        amount: '3200.00',
        currency: 'USD',
        transaction_type: 'transfer',
        description: 'Salary advance',
        metadata: { channel: 'mobile', country: 'US' }
      };

      const result = integrator.processTransaction(transaction);
      expect(result.data.status).toBe('approved');
      expect(result.data.fraud_risk_level).toBe('LOW');
    });
  });

  describe('File Management', () => {
    beforeEach(() => {
      // Clear directories before each test
      const dirs = ['input', 'processing', 'output', 'results'];
      for (const dir of dirs) {
        const dirPath = path.join(tmpDir, dir);
        if (fs.existsSync(dirPath)) {
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      }
      // Re-initialize directories
      integrator.initializeDirectories();
    });

    it('should create result file in results directory', () => {
      const transaction = {
        transaction_id: 'TXN-FM-001',
        timestamp: '2026-03-16T09:00:00Z',
        source_account: 'ACC-1001',
        destination_account: 'ACC-2001',
        amount: '1500.00',
        currency: 'USD',
        transaction_type: 'transfer',
        description: 'File Management Test',
        metadata: { channel: 'online', country: 'US' }
      };

      integrator.processTransaction(transaction);

      const resultFile = path.join(tmpDir, 'results', 'TXN-FM-001.json');
      expect(fs.existsSync(resultFile)).toBe(true);
    });

    it('should write valid JSON in result file', () => {
      const transaction = {
        transaction_id: 'TXN-FM-002',
        timestamp: '2026-03-16T09:00:00Z',
        source_account: 'ACC-1001',
        destination_account: 'ACC-2001',
        amount: '1500.00',
        currency: 'USD',
        transaction_type: 'transfer',
        description: 'File Management Test',
        metadata: { channel: 'online', country: 'US' }
      };

      integrator.processTransaction(transaction);

      const resultFile = path.join(tmpDir, 'results', 'TXN-FM-002.json');
      const content = fs.readFileSync(resultFile, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should not leave temporary files in processing directory', () => {
      const transaction = {
        transaction_id: 'TXN-FM-003',
        timestamp: '2026-03-16T09:00:00Z',
        source_account: 'ACC-1001',
        destination_account: 'ACC-2001',
        amount: '1500.00',
        currency: 'USD',
        transaction_type: 'transfer',
        description: 'File Management Test',
        metadata: { channel: 'online', country: 'US' }
      };

      integrator.processTransaction(transaction);

      const processingDir = path.join(tmpDir, 'processing');
      const files = fs.readdirSync(processingDir);
      expect(files.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle transaction with missing required fields gracefully', () => {
      const transaction = {
        transaction_id: 'TXN-ERR-001',
        // Missing other required fields
        amount: '1500.00'
      };

      expect(() => {
        integrator.processTransaction(transaction);
      }).not.toThrow();
    });

    it('should process transaction even if metadata is empty', () => {
      const transaction = {
        transaction_id: 'TXN-ERR-002',
        timestamp: '2026-03-16T09:00:00Z',
        source_account: 'ACC-1001',
        destination_account: 'ACC-2001',
        amount: '1500.00',
        currency: 'USD',
        transaction_type: 'transfer',
        description: 'Test',
        metadata: {}
      };

      const result = integrator.processTransaction(transaction);
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe('Sample Transaction JSON Processing', () => {
    beforeEach(() => {
      // Clear directories before each test
      const dirs = ['input', 'processing', 'output', 'results'];
      for (const dir of dirs) {
        const dirPath = path.join(tmpDir, dir);
        if (fs.existsSync(dirPath)) {
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      }
      // Re-initialize directories
      integrator.initializeDirectories();
    });

    it('should process all 8 sample transactions', () => {
      const samplePath = path.join(__dirname, '../sample-transactions.json');
      const transactions = JSON.parse(fs.readFileSync(samplePath, 'utf-8'));
      expect(transactions.length).toBe(8);

      const results = [];
      for (const transaction of transactions) {
        const result = integrator.processTransaction(transaction);
        results.push(result);
      }

      expect(results.length).toBe(8);
    });

    it('should create 8 result files', () => {
      const sampleTransactionsPath = path.join(__dirname, '../sample-transactions.json');
      const transactions = JSON.parse(fs.readFileSync(sampleTransactionsPath, 'utf-8'));

      for (const transaction of transactions) {
        integrator.processTransaction(transaction);
      }

      const resultsDir = path.join(tmpDir, 'results');
      const resultFiles = fs.readdirSync(resultsDir);
      expect(resultFiles.length).toBe(8);
    });

    it('should have correct rejection status for TXN006 and TXN007', () => {
      const sampleTransactionsPath = path.join(__dirname, '../sample-transactions.json');
      const transactions = JSON.parse(fs.readFileSync(sampleTransactionsPath, 'utf-8'));

      const results = {};
      for (const transaction of transactions) {
        const result = integrator.processTransaction(transaction);
        results[result.data.transaction_id] = result;
      }

      expect(results.TXN006.data.status).toBe('rejected');
      expect(results.TXN006.data.reason).toBe('INVALID_CURRENCY');
      expect(results.TXN007.data.status).toBe('rejected');
      expect(results.TXN007.data.reason).toBe('INVALID_AMOUNT');
    });

    it('should have HIGH fraud level for TXN005', () => {
      const sampleTransactionsPath = path.join(__dirname, '../sample-transactions.json');
      const transactions = JSON.parse(fs.readFileSync(sampleTransactionsPath, 'utf-8'));

      const results = {};
      for (const transaction of transactions) {
        const result = integrator.processTransaction(transaction);
        results[result.data.transaction_id] = result;
      }

      expect(results.TXN005.data.fraud_risk_level).toBe('HIGH');
    });

    it('should have watchlist score for TXN003', () => {
      const sampleTransactionsPath = path.join(__dirname, '../sample-transactions.json');
      const transactions = JSON.parse(fs.readFileSync(sampleTransactionsPath, 'utf-8'));

      const results = {};
      for (const transaction of transactions) {
        const result = integrator.processTransaction(transaction);
        results[result.data.transaction_id] = result;
      }

      expect(results.TXN003.data.fraud_risk_score).toBe(5);
    });

    it('should have MEDIUM risk for TXN004 with score 3', () => {
      const sampleTransactionsPath = path.join(__dirname, '../sample-transactions.json');
      const transactions = JSON.parse(fs.readFileSync(sampleTransactionsPath, 'utf-8'));

      const results = {};
      for (const transaction of transactions) {
        const result = integrator.processTransaction(transaction);
        results[result.data.transaction_id] = result;
      }

      expect(results.TXN004.data.fraud_risk_level).toBe('MEDIUM');
      expect(results.TXN004.data.fraud_risk_score).toBe(3);
    });

    it('should have all agent_chain entries for approved transactions', () => {
      const sampleTransactionsPath = path.join(__dirname, '../sample-transactions.json');
      const transactions = JSON.parse(fs.readFileSync(sampleTransactionsPath, 'utf-8'));

      const results = {};
      for (const transaction of transactions) {
        const result = integrator.processTransaction(transaction);
        results[result.data.transaction_id] = result;
      }

      // TXN001 (approved, went through all agents)
      expect(results.TXN001.agent_chain).toContain('integrator');
      expect(results.TXN001.agent_chain).toContain('transaction-validator');
      expect(results.TXN001.agent_chain).toContain('fraud-detector');
      expect(results.TXN001.agent_chain).toContain('compliance-checker');
    });

    it('should have limited agent_chain for rejected transactions', () => {
      const sampleTransactionsPath = path.join(__dirname, '../sample-transactions.json');
      const transactions = JSON.parse(fs.readFileSync(sampleTransactionsPath, 'utf-8'));

      const results = {};
      for (const transaction of transactions) {
        const result = integrator.processTransaction(transaction);
        results[result.data.transaction_id] = result;
      }

      // TXN006 (rejected by validator)
      expect(results.TXN006.agent_chain).toContain('integrator');
      expect(results.TXN006.agent_chain).toContain('transaction-validator');
      expect(results.TXN006.agent_chain).not.toContain('fraud-detector');
      expect(results.TXN006.agent_chain).not.toContain('compliance-checker');
    });
  });
});


