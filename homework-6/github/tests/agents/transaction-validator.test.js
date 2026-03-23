const { processMessage } = require('../../src/agents/transaction-validator');
const Decimal = require('decimal.js');

describe('Transaction Validator Agent', () => {
  const baseMessage = {
    message_id: 'test-msg-001',
    timestamp: '2026-03-16T09:00:00Z',
    source_agent: 'integrator',
    target_agent: 'transaction-validator',
    message_type: 'transaction',
    agent_chain: ['integrator'],
    data: {
      transaction_id: 'TXN001',
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
    }
  };

  describe('Valid Transactions', () => {
    it('should validate a properly formatted transaction', () => {
      const result = processMessage(baseMessage);
      expect(result.data.status).toBe('validated');
      expect(result.data.reason).toBeNull();
      expect(result.source_agent).toBe('transaction-validator');
      expect(result.target_agent).toBe('fraud-detector');
    });

    it('should preserve message_id and timestamp', () => {
      const result = processMessage(baseMessage);
      expect(result.message_id).toBe('test-msg-001');
      expect(result.timestamp).toBe('2026-03-16T09:00:00Z');
    });

    it('should update agent_chain with transaction-validator', () => {
      const result = processMessage(baseMessage);
      expect(result.agent_chain).toContain('integrator');
      expect(result.agent_chain).toContain('transaction-validator');
      expect(result.agent_chain.length).toBe(2);
    });

    it('should accept valid currency USD', () => {
      const msg = { ...baseMessage, data: { ...baseMessage.data } };
      const result = processMessage(msg);
      expect(result.data.status).toBe('validated');
    });

    it('should accept valid currency EUR', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, currency: 'EUR' }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('validated');
    });

    it('should accept valid currency GBP', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, currency: 'GBP' }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('validated');
    });

    it('should accept valid currency JPY', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, currency: 'JPY' }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('validated');
    });

    it('should accept valid currency CAD', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, currency: 'CAD' }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('validated');
    });

    it('should accept valid currency AUD', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, currency: 'AUD' }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('validated');
    });

    it('should accept valid currency CHF', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, currency: 'CHF' }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('validated');
    });

    it('should accept large amounts (1000000.00)', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, amount: '1000000.00' }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('validated');
    });

    it('should accept small decimal precision amounts (0.01)', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, amount: '0.01' }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('validated');
    });
  });

  describe('Amount Validation', () => {
    it('should reject zero amount', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, amount: '0' }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('INVALID_AMOUNT');
    });

    it('should reject negative amount (-100.00)', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, amount: '-100.00' }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('INVALID_AMOUNT');
    });

    it('should reject non-numeric amount', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, amount: 'invalid' }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('INVALID_AMOUNT');
    });

    it('should reject amount with invalid format', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, amount: 'abc123' }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('INVALID_AMOUNT');
    });
  });

  describe('Currency Validation', () => {
    it('should reject invalid currency XYZ (TXN006 pattern)', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, currency: 'XYZ' }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('INVALID_CURRENCY');
    });

    it('should reject invalid currency ABC', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, currency: 'ABC' }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('INVALID_CURRENCY');
    });

    it('should reject lowercase currency (usd)', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, currency: 'usd' }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('INVALID_CURRENCY');
    });

    it('should reject empty currency string', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, currency: '' }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('INVALID_CURRENCY');
    });
  });

  describe('Required Fields Validation', () => {
    it('should reject missing transaction_id', () => {
      const msg = {
        ...baseMessage,
        data: {
          ...baseMessage.data,
          transaction_id: undefined
        }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('MISSING_FIELD');
    });

    it('should reject missing amount', () => {
      const msg = {
        ...baseMessage,
        data: {
          ...baseMessage.data,
          amount: undefined
        }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('MISSING_FIELD');
    });

    it('should reject missing currency', () => {
      const msg = {
        ...baseMessage,
        data: {
          ...baseMessage.data,
          currency: undefined
        }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('MISSING_FIELD');
    });

    it('should reject missing source_account', () => {
      const msg = {
        ...baseMessage,
        data: {
          ...baseMessage.data,
          source_account: undefined
        }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('MISSING_FIELD');
    });

    it('should reject missing destination_account', () => {
      const msg = {
        ...baseMessage,
        data: {
          ...baseMessage.data,
          destination_account: undefined
        }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('MISSING_FIELD');
    });

    it('should reject missing transaction_type', () => {
      const msg = {
        ...baseMessage,
        data: {
          ...baseMessage.data,
          transaction_type: undefined
        }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('MISSING_FIELD');
    });

    it('should reject missing timestamp', () => {
      const msg = {
        ...baseMessage,
        data: {
          ...baseMessage.data,
          timestamp: undefined
        }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('MISSING_FIELD');
    });

    it('should reject null field values', () => {
      const msg = {
        ...baseMessage,
        data: {
          ...baseMessage.data,
          amount: null
        }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('MISSING_FIELD');
    });
  });

  describe('Decimal Usage', () => {
    it('should use Decimal for amount comparison', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, amount: '0.1' }
      };
      const result = processMessage(msg);
      // amount 0.1 is > 0, so should be valid
      expect(result.data.status).toBe('validated');
    });

    it('should use Decimal for edge case 0.0001', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, amount: '0.0001' }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('validated');
    });

    it('should accurately reject -0.01 negative amount', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, amount: '-0.01' }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('rejected');
      expect(result.data.reason).toBe('INVALID_AMOUNT');
    });

    it('should handle very large decimal amounts', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, amount: '999999999.99' }
      };
      const result = processMessage(msg);
      expect(result.data.status).toBe('validated');
    });
  });

  describe('Message Envelope Preservation', () => {
    it('should preserve metadata in transaction data', () => {
      const result = processMessage(baseMessage);
      expect(result.data.metadata).toBeDefined();
      expect(result.data.metadata.channel).toBe('online');
      expect(result.data.metadata.country).toBe('US');
    });

    it('should preserve all original transaction fields', () => {
      const result = processMessage(baseMessage);
      expect(result.data.transaction_id).toBe('TXN001');
      expect(result.data.source_account).toBe('ACC-1001');
      expect(result.data.destination_account).toBe('ACC-2001');
      expect(result.data.amount).toBe('1500.00');
      expect(result.data.currency).toBe('USD');
      expect(result.data.transaction_type).toBe('transfer');
      expect(result.data.description).toBe('Test Transaction');
    });

    it('should set status and reason fields on successful validation', () => {
      const result = processMessage(baseMessage);
      expect('status' in result.data).toBe(true);
      expect('reason' in result.data).toBe(true);
    });
  });

  describe('Logging (verified through standard output)', () => {
    it('should log successful validation', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      processMessage(baseMessage);
      const logs = consoleSpy.mock.calls;
      expect(logs.some((call) => call[0].includes('transaction-validator'))).toBe(true);
      expect(logs.some((call) => call[0].includes('validated'))).toBe(true);
      consoleSpy.mockRestore();
    });

    it('should log validation failures', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, currency: 'XYZ' }
      };
      processMessage(msg);
      const logs = consoleSpy.mock.calls;
      expect(logs.some((call) => call[0].includes('transaction-validator'))).toBe(true);
      expect(logs.some((call) => call[0].includes('INVALID_CURRENCY'))).toBe(true);
      consoleSpy.mockRestore();
    });

    it('should include ISO 8601 timestamp in logs', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      processMessage(baseMessage);
      const logs = consoleSpy.mock.calls;
      const logMessage = logs.find((call) => call[0].includes('transaction-validator'));
      // ISO 8601 timestamp format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(logMessage[0]).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      consoleSpy.mockRestore();
    });

    it('should mask account numbers in logs', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      processMessage(baseMessage);
      const logs = consoleSpy.mock.calls;
      const logMessage = logs
        .find((call) => call[0].includes('transaction-validator'))
        ?.[0] || '';
      expect(logMessage).toMatch(/ACC-.*\*\*\*\*/);
      expect(logMessage).not.toContain('1001');
      consoleSpy.mockRestore();
    });
  });

  describe('Target Agent Routing', () => {
    it('should route validated transactions to fraud-detector', () => {
      const result = processMessage(baseMessage);
      expect(result.target_agent).toBe('fraud-detector');
    });

    it('should route rejected transactions to compliance-checker', () => {
      const msg = {
        ...baseMessage,
        data: { ...baseMessage.data, currency: 'XYZ' }
      };
      const result = processMessage(msg);
      expect(result.target_agent).toBe('compliance-checker');
    });
  });
});
