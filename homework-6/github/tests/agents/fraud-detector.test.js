const { processMessage, calculateFraudScore } = require('../../src/agents/fraud-detector');
const Decimal = require('decimal.js');

describe('Fraud Detector Agent', () => {
  const validatedMessage = {
    message_id: 'test-msg-002',
    timestamp: '2026-03-16T09:00:00Z',
    source_agent: 'transaction-validator',
    target_agent: 'fraud-detector',
    message_type: 'transaction',
    agent_chain: ['integrator', 'transaction-validator'],
    data: {
      transaction_id: 'TXN001',
      timestamp: '2026-03-16T09:00:00Z',
      source_account: 'ACC-1001',
      destination_account: 'ACC-2001',
      amount: '1500.00',
      currency: 'USD',
      transaction_type: 'transfer',
      status: 'validated',
      reason: null,
      description: 'Test Transaction',
      metadata: {
        channel: 'online',
        country: 'US'
      }
    }
  };

  describe('Risk Score Calculation', () => {
    describe('Amount-based Scoring', () => {
      it('should score LOW risk for amount 1500.00', () => {
        const { score, level } = calculateFraudScore('1500.00', 'ACC-2001', '2026-03-16T09:00:00Z', { country: 'US' });
        expect(score).toBe(0);
        expect(level).toBe('LOW');
      });

      it('should add +3 for amount > 10000', () => {
        const { score } = calculateFraudScore('25000.00', 'ACC-2001', '2026-03-16T09:00:00Z', { country: 'US' });
        expect(score).toBe(3);
      });

      it('should add +4 additional for amount > 50000 (total 7)', () => {
        const { score } = calculateFraudScore('75000.00', 'ACC-2001', '2026-03-16T09:00:00Z', { country: 'US' });
        expect(score).toBe(7);
      });

      it('should handle amount exactly at 10000.00 (no > 10000)', () => {
        const { score } = calculateFraudScore('10000.00', 'ACC-2001', '2026-03-16T09:00:00Z', { country: 'US' });
        expect(score).toBe(0);
      });

      it('should handle amount just above 10000.01 (scores +3)', () => {
        const { score } = calculateFraudScore('10000.01', 'ACC-2001', '2026-03-16T09:00:00Z', { country: 'US' });
        expect(score).toBe(3);
      });

      it('should handle amount exactly at 50000.00 (no > 50000)', () => {
        const { score } = calculateFraudScore('50000.00', 'ACC-2001', '2026-03-16T09:00:00Z', { country: 'US' });
        expect(score).toBe(3);
      });

      it('should handle amount just above 50000.01 (scores +3+4=7)', () => {
        const { score } = calculateFraudScore('50000.01', 'ACC-2001', '2026-03-16T09:00:00Z', { country: 'US' });
        expect(score).toBe(7);
      });
    });

    describe('Timestamp-based Scoring (Unusual Hours)', () => {
      it('should score 0 for normal hours (09:00)', () => {
        const { score } = calculateFraudScore('500.00', 'ACC-2001', '2026-03-16T09:00:00Z', { country: 'US' });
        expect(score).toBe(0);
      });

      it('should add +2 for unusual hour 02:47 UTC (TXN004 pattern)', () => {
        const { score } = calculateFraudScore('500.00', 'ACC-2001', '2026-03-16T02:47:00Z', { country: 'US' });
        expect(score).toBe(2);
      });

      it('should add +2 for hour 02:00', () => {
        const { score } = calculateFraudScore('500.00', 'ACC-2001', '2026-03-16T02:00:00Z', { country: 'US' });
        expect(score).toBe(2);
      });

      it('should add +2 for hour 03:30', () => {
        const { score } = calculateFraudScore('500.00', 'ACC-2001', '2026-03-16T03:30:00Z', { country: 'US' });
        expect(score).toBe(2);
      });

      it('should add +2 for hour 05:00', () => {
        const { score } = calculateFraudScore('500.00', 'ACC-2001', '2026-03-16T05:00:00Z', { country: 'US' });
        expect(score).toBe(2);
      });

      it('should NOT add for hour 01:59 (before unusual window)', () => {
        const { score } = calculateFraudScore('500.00', 'ACC-2001', '2026-03-16T01:59:00Z', { country: 'US' });
        expect(score).toBe(0);
      });

      it('should NOT add for hour 06:00 (after unusual window)', () => {
        const { score } = calculateFraudScore('500.00', 'ACC-2001', '2026-03-16T06:00:00Z', { country: 'US' });
        expect(score).toBe(0);
      });

      it('should handle invalid timestamp gracefully', () => {
        const { score } = calculateFraudScore('500.00', 'ACC-2001', 'invalid-timestamp', { country: 'US' });
        expect(score).toBe(0);
      });
    });

    describe('Geographic Scoring (Cross-Border)', () => {
      it('should NOT add for US country (domestic)', () => {
        const { score } = calculateFraudScore('500.00', 'ACC-2001', '2026-03-16T09:00:00Z', { country: 'US' });
        expect(score).toBe(0);
      });

      it('should add +1 for non-US country (DE)', () => {
        const { score } = calculateFraudScore('500.00', 'ACC-2001', '2026-03-16T09:00:00Z', { country: 'DE' });
        expect(score).toBe(1);
      });

      it('should add +1 for non-US country (GB)', () => {
        const { score } = calculateFraudScore('500.00', 'ACC-2001', '2026-03-16T09:00:00Z', { country: 'GB' });
        expect(score).toBe(1);
      });

      it('should add +1 for non-US country (JP)', () => {
        const { score } = calculateFraudScore('500.00', 'ACC-2001', '2026-03-16T09:00:00Z', { country: 'JP' });
        expect(score).toBe(1);
      });

      it('should handle missing country metadata', () => {
        const { score } = calculateFraudScore('500.00', 'ACC-2001', '2026-03-16T09:00:00Z', {});
        expect(score).toBe(0);
      });

      it('should handle null metadata', () => {
        const { score } = calculateFraudScore('500.00', 'ACC-2001', '2026-03-16T09:00:00Z', null);
        expect(score).toBe(0);
      });
    });

    describe('Watchlist Scoring', () => {
      it('should NOT add for normal destination account', () => {
        const { score } = calculateFraudScore('500.00', 'ACC-2001', '2026-03-16T09:00:00Z', { country: 'US' });
        expect(score).toBe(0);
      });

      it('should add +5 for watchlist account ACC-9999', () => {
        const { score } = calculateFraudScore('500.00', 'ACC-9999', '2026-03-16T09:00:00Z', { country: 'US' });
        expect(score).toBe(5);
      });

      it('should handle TXN003 watchlist pattern correctly', () => {
        const { score, level } = calculateFraudScore('9999.99', 'ACC-9999', '2026-03-16T09:30:00Z', { country: 'US' });
        expect(score).toBe(5);
        expect(level).toBe('MEDIUM');
      });
    });

    describe('Combined Scoring', () => {
      it('should calculate TXN004 pattern: unusual hour + cross-border', () => {
        // TXN004: 02:47 UTC + DE country = +2 +1 = 3
        const { score, level } = calculateFraudScore('500.00', 'ACC-5500', '2026-03-16T02:47:00Z', { country: 'DE' });
        expect(score).toBe(3);
        expect(level).toBe('MEDIUM');
      });

      it('should calculate TXN005 pattern: large amount', () => {
        // TXN005: $75K = +3 +4 = 7
        const { score, level } = calculateFraudScore('75000.00', 'ACC-6600', '2026-03-16T10:00:00Z', { country: 'US' });
        expect(score).toBe(7);
        expect(level).toBe('HIGH');
      });

      it('should calculate complex pattern: amount + unusual hour + watchlist', () => {
        // $25K + 02:00 + ACC-9999 = 3 + 2 + 5 = 10
        const { score, level } = calculateFraudScore('25000.00', 'ACC-9999', '2026-03-16T02:00:00Z', { country: 'US' });
        expect(score).toBe(10);
        expect(level).toBe('HIGH');
      });

      it('should calculate all factors: large amount + unusual hour + cross-border + watchlist', () => {
        // $75K + 02:00 + DE + ACC-9999 = 7 + 2 + 1 + 5 = 15
        const { score, level } = calculateFraudScore('75000.00', 'ACC-9999', '2026-03-16T02:00:00Z', { country: 'DE' });
        expect(score).toBe(15);
        expect(level).toBe('HIGH');
      });
    });
  });

  describe('Risk Level Classification', () => {
    it('should classify 0-2 points as LOW', () => {
      const { level: level0 } = calculateFraudScore('100.00', 'ACC-2001', '2026-03-16T09:00:00Z', { country: 'US' });
      expect(level0).toBe('LOW');

      const { level: level2 } = calculateFraudScore('500.00', 'ACC-2001', '2026-03-16T02:00:00Z', { country: 'US' });
      expect(level2).toBe('LOW');
    });

    it('should classify 3-6 points as MEDIUM', () => {
      const { level: level3 } = calculateFraudScore('25000.00', 'ACC-2001', '2026-03-16T09:00:00Z', { country: 'US' });
      expect(level3).toBe('MEDIUM');

      const { level: level6 } = calculateFraudScore('50000.00', 'ACC-2001', '2026-03-16T02:00:00Z', { country: 'DE' });
      expect(level6).toBe('MEDIUM');
    });

    it('should classify 7+ points as HIGH', () => {
      const { level: level7 } = calculateFraudScore('75000.00', 'ACC-2001', '2026-03-16T09:00:00Z', { country: 'US' });
      expect(level7).toBe('HIGH');

      const { level: level10 } = calculateFraudScore('75000.00', 'ACC-9999', '2026-03-16T09:00:00Z', { country: 'US' });
      expect(level10).toBe('HIGH');
    });
  });

  describe('Message Processing', () => {
    it('should process validated transaction', () => {
      const result = processMessage(validatedMessage);
      expect(result.data.fraud_risk_score).toBeDefined();
      expect(result.data.fraud_risk_level).toBeDefined();
      expect(typeof result.data.fraud_risk_score).toBe('number');
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.data.fraud_risk_level);
    });

    it('should preserve validated status', () => {
      const result = processMessage(validatedMessage);
      expect(result.data.status).toBe('validated');
    });

    it('should NOT change status field', () => {
      const result = processMessage(validatedMessage);
      expect(result.data.status).not.toBeUndefined();
    });

    it('should pass through non-validated transactions', () => {
      const rejectedMessage = {
        ...validatedMessage,
        data: {
          ...validatedMessage.data,
          status: 'rejected'
        }
      };
      const result = processMessage(rejectedMessage);
      expect(result.data.status).toBe('rejected');
      expect(result.data.fraud_risk_score).toBeUndefined();
    });

    it('should update source_agent to fraud-detector', () => {
      const result = processMessage(validatedMessage);
      expect(result.source_agent).toBe('fraud-detector');
    });

    it('should update target_agent to compliance-checker', () => {
      const result = processMessage(validatedMessage);
      expect(result.target_agent).toBe('compliance-checker');
    });

    it('should update agent_chain with fraud-detector', () => {
      const result = processMessage(validatedMessage);
      expect(result.agent_chain).toContain('fraud-detector');
    });
  });

  describe('CTR Required Flag', () => {
    it('should set ctr_required for wire_transfer > 10000', () => {
      const msg = {
        ...validatedMessage,
        data: {
          ...validatedMessage.data,
          amount: '25000.00',
          transaction_type: 'wire_transfer'
        }
      };
      const result = processMessage(msg);
      expect(result.data.ctr_required).toBe(true);
    });

    it('should set ctr_required for $75K wire transfer (TXN005 pattern)', () => {
      const msg = {
        ...validatedMessage,
        data: {
          ...validatedMessage.data,
          transaction_id: 'TXN005',
          amount: '75000.00',
          transaction_type: 'wire_transfer'
        }
      };
      const result = processMessage(msg);
      expect(result.data.ctr_required).toBe(true);
      expect(result.data.fraud_risk_level).toBe('HIGH');
    });

    it('should NOT set ctr_required for transfer (not wire_transfer)', () => {
      const msg = {
        ...validatedMessage,
        data: {
          ...validatedMessage.data,
          amount: '25000.00',
          transaction_type: 'transfer'
        }
      };
      const result = processMessage(msg);
      expect(result.data.ctr_required).toBe(false);
    });

    it('should NOT set ctr_required for wire_transfer <= 10000', () => {
      const msg = {
        ...validatedMessage,
        data: {
          ...validatedMessage.data,
          amount: '5000.00',
          transaction_type: 'wire_transfer'
        }
      };
      const result = processMessage(msg);
      expect(result.data.ctr_required).toBe(false);
    });

    it('should NOT set ctr_required for wire_transfer exactly 10000.00', () => {
      const msg = {
        ...validatedMessage,
        data: {
          ...validatedMessage.data,
          amount: '10000.00',
          transaction_type: 'wire_transfer'
        }
      };
      const result = processMessage(msg);
      expect(result.data.ctr_required).toBe(false);
    });
  });

  describe('Edge Cases from Sample Transactions', () => {
    it('should process TXN001: LOW risk normal transfer', () => {
      const msg = {
        ...validatedMessage,
        data: {
          ...validatedMessage.data,
          transaction_id: 'TXN001',
          amount: '1500.00',
          transaction_type: 'transfer'
        }
      };
      const result = processMessage(msg);
      expect(result.data.fraud_risk_level).toBe('LOW');
      expect(result.data.ctr_required).toBe(false);
    });

    it('should process TXN002: MEDIUM risk for $25K wire', () => {
      const msg = {
        ...validatedMessage,
        data: {
          ...validatedMessage.data,
          transaction_id: 'TXN002',
          amount: '25000.00',
          transaction_type: 'wire_transfer'
        }
      };
      const result = processMessage(msg);
      expect(result.data.fraud_risk_level).toBe('MEDIUM');
      expect(result.data.ctr_required).toBe(true);
    });

    it('should process TXN003: watchlist detection', () => {
      const msg = {
        ...validatedMessage,
        data: {
          ...validatedMessage.data,
          transaction_id: 'TXN003',
          amount: '9999.99',
          destination_account: 'ACC-9999'
        }
      };
      const result = processMessage(msg);
      expect(result.data.fraud_risk_score).toBe(5);
      expect(result.data.fraud_risk_level).toBe('MEDIUM');
    });

    it('should process TXN004: unusual hour + cross-border', () => {
      const msg = {
        ...validatedMessage,
        data: {
          ...validatedMessage.data,
          transaction_id: 'TXN004',
          amount: '500.00',
          timestamp: '2026-03-16T02:47:00Z',
          metadata: { country: 'DE', channel: 'api' }
        }
      };
      const result = processMessage(msg);
      expect(result.data.fraud_risk_score).toBe(3);
      expect(result.data.fraud_risk_level).toBe('MEDIUM');
    });

    it('should process TXN005: HIGH risk large wire', () => {
      const msg = {
        ...validatedMessage,
        data: {
          ...validatedMessage.data,
          transaction_id: 'TXN005',
          amount: '75000.00',
          transaction_type: 'wire_transfer'
        }
      };
      const result = processMessage(msg);
      expect(result.data.fraud_risk_level).toBe('HIGH');
      expect(result.data.ctr_required).toBe(true);
    });
  });

  describe('Logging', () => {
    it('should log fraud detection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      processMessage(validatedMessage);
      const logs = consoleSpy.mock.calls;
      expect(logs.some((call) => call[0].includes('fraud-detector'))).toBe(true);
      consoleSpy.mockRestore();
    });

    it('should include fraud score and level in logs', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const msg = {
        ...validatedMessage,
        data: {
          ...validatedMessage.data,
          amount: '75000.00'
        }
      };
      processMessage(msg);
      const logs = consoleSpy.mock.calls;
      const logMessage = logs.find((call) => call[0].includes('fraud-detector'))?.[0] || '';
      expect(logMessage).toMatch(/score:\d+/);
      expect(logMessage).toMatch(/level:(LOW|MEDIUM|HIGH)/);
      consoleSpy.mockRestore();
    });

    it('should mask account in logs', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      processMessage(validatedMessage);
      const logs = consoleSpy.mock.calls;
      const logMessage = logs.find((call) => call[0].includes('fraud-detector'))?.[0] || '';
      expect(logMessage).toMatch(/ACC-.*\*\*\*\*/);
      expect(logMessage).not.toContain('1001');
      consoleSpy.mockRestore();
    });
  });

  describe('Decimal Usage in CTR Calculation', () => {
    it('should use Decimal for amount comparison in ctr_required', () => {
      const msg = {
        ...validatedMessage,
        data: {
          ...validatedMessage.data,
          amount: '10000.01',
          transaction_type: 'wire_transfer'
        }
      };
      const result = processMessage(msg);
      expect(result.data.ctr_required).toBe(true);
    });

    it('should correctly identify boundary at 10000 for Decimal', () => {
      const msg1 = {
        ...validatedMessage,
        data: {
          ...validatedMessage.data,
          amount: '10000.00',
          transaction_type: 'wire_transfer'
        }
      };
      const result1 = processMessage(msg1);
      expect(result1.data.ctr_required).toBe(false);

      const msg2 = {
        ...validatedMessage,
        data: {
          ...validatedMessage.data,
          amount: '10000.01',
          transaction_type: 'wire_transfer'
        }
      };
      const result2 = processMessage(msg2);
      expect(result2.data.ctr_required).toBe(true);
    });
  });
});
