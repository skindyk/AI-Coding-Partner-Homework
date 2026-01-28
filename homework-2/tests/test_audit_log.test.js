const AuditLog = require('../src/AuditLog');

describe('AuditLog Module', () => {
  beforeEach(() => {
    AuditLog.clear();
  });

  describe('logClassification', () => {
    test('should log a classification decision', () => {
      const classification = {
        category: 'account_access',
        priority: 'high',
        confidence: 0.85,
        reasoning: 'Detected login keywords',
        keywords_found: ['cannot', 'login']
      };

      const ticket = {
        id: 'test_123',
        subject: 'Cannot login',
        description: 'I cannot login to my account'
      };

      const log = AuditLog.logClassification('test_123', classification, 'manual_classify', ticket);

      expect(log).toBeDefined();
      expect(log.ticketId).toBe('test_123');
      expect(log.action).toBe('manual_classify');
      expect(log.classification.category).toBe('account_access');
      expect(log.timestamp).toBeDefined();
    });

    test('should log auto-classification on create', () => {
      const classification = {
        category: 'technical_issue',
        priority: 'urgent',
        confidence: 0.9,
        reasoning: 'Critical production issue detected',
        keywords_found: ['production', 'down', 'critical']
      };

      const log = AuditLog.logClassification('auto_001', classification, 'auto_classify_on_create');

      expect(log.action).toBe('auto_classify_on_create');
      expect(log.classification.priority).toBe('urgent');
    });
  });

  describe('getAllLogs', () => {
    test('should return all logs', () => {
      const classification = {
        category: 'billing_question',
        priority: 'medium',
        confidence: 0.75,
        reasoning: 'Payment keywords detected',
        keywords_found: ['payment', 'charge']
      };

      AuditLog.logClassification('bill_001', classification, 'manual_classify');
      AuditLog.logClassification('bill_002', classification, 'manual_classify');

      const logs = AuditLog.getAllLogs();

      expect(logs).toHaveLength(2);
    });

    test('should return empty array when no logs', () => {
      const logs = AuditLog.getAllLogs();
      expect(logs).toEqual([]);
    });
  });

  describe('getLogsForTicket', () => {
    test('should filter logs by ticket ID', () => {
      const classification = {
        category: 'account_access',
        priority: 'high',
        confidence: 0.8,
        reasoning: 'Test',
        keywords_found: []
      };

      AuditLog.logClassification('ticket_1', classification, 'manual_classify');
      AuditLog.logClassification('ticket_1', classification, 'manual_classify');
      AuditLog.logClassification('ticket_2', classification, 'manual_classify');

      const logs = AuditLog.getLogsForTicket('ticket_1');

      expect(logs).toHaveLength(2);
      expect(logs.every(log => log.ticketId === 'ticket_1')).toBe(true);
    });

    test('should return empty array for non-existent ticket', () => {
      const logs = AuditLog.getLogsForTicket('nonexistent');
      expect(logs).toEqual([]);
    });
  });

  describe('getLogsByAction', () => {
    test('should filter logs by action type', () => {
      const classification = {
        category: 'feature_request',
        priority: 'low',
        confidence: 0.7,
        reasoning: 'Feature request detected',
        keywords_found: ['add', 'feature']
      };

      AuditLog.logClassification('feat_001', classification, 'auto_classify_on_create');
      AuditLog.logClassification('feat_002', classification, 'manual_classify');
      AuditLog.logClassification('feat_003', classification, 'auto_classify_on_create');

      const autoLogs = AuditLog.getLogsByAction('auto_classify_on_create');
      const manualLogs = AuditLog.getLogsByAction('manual_classify');

      expect(autoLogs).toHaveLength(2);
      expect(manualLogs).toHaveLength(1);
    });
  });

  describe('getLogsSince', () => {
    test('should filter logs by timestamp', (done) => {
      const classification = {
        category: 'bug_report',
        priority: 'high',
        confidence: 0.88,
        reasoning: 'Bug detected',
        keywords_found: ['bug']
      };

      AuditLog.logClassification('bug_001', classification, 'manual_classify');

      const timestamp = new Date().toISOString();

      setTimeout(() => {
        AuditLog.logClassification('bug_002', classification, 'manual_classify');

        const logs = AuditLog.getLogsSince(timestamp);

        expect(logs.length).toBeGreaterThan(0);
        expect(logs[logs.length - 1].ticketId).toBe('bug_002');
        done();
      }, 100);
    });
  });

  describe('getStatistics', () => {
    test('should calculate statistics', () => {
      const classification1 = {
        category: 'account_access',
        priority: 'urgent',
        confidence: 0.9,
        reasoning: 'Test',
        keywords_found: []
      };

      const classification2 = {
        category: 'technical_issue',
        priority: 'high',
        confidence: 0.8,
        reasoning: 'Test',
        keywords_found: []
      };

      AuditLog.logClassification('stat_001', classification1, 'auto_classify_on_create');
      AuditLog.logClassification('stat_002', classification2, 'manual_classify');

      const stats = AuditLog.getStatistics();

      expect(stats.total_logs).toBe(2);
      expect(stats.by_action.auto_classify_on_create).toBe(1);
      expect(stats.by_action.manual_classify).toBe(1);
      expect(stats.by_category.account_access).toBe(1);
      expect(stats.by_category.technical_issue).toBe(1);
      expect(stats.by_priority.urgent).toBe(1);
      expect(stats.by_priority.high).toBe(1);
      expect(parseFloat(stats.average_confidence)).toBe(0.85);
    });

    test('should handle empty logs', () => {
      const stats = AuditLog.getStatistics();

      expect(stats.total_logs).toBe(0);
      expect(stats.average_confidence).toBe(0);
    });
  });

  describe('clear', () => {
    test('should clear all logs', () => {
      const classification = {
        category: 'other',
        priority: 'low',
        confidence: 0.6,
        reasoning: 'Test',
        keywords_found: []
      };

      AuditLog.logClassification('clear_001', classification, 'manual_classify');
      expect(AuditLog.getAllLogs()).toHaveLength(1);

      AuditLog.clear();
      expect(AuditLog.getAllLogs()).toHaveLength(0);
    });
  });
});
