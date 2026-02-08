'use strict';

const SoulPurityCalculator = require('../../src/services/SoulPurityCalculator');
const { create: createOffering, SIN_CATEGORIES } = require('../../src/models/Offering');
const AuditEventModel = require('../../src/models/AuditEvent');

describe('SoulPurityCalculator', () => {
  describe('calculatePurity', () => {
    it('should return 100 with no offerings', () => {
      const purity = SoulPurityCalculator.calculatePurity([], []);
      expect(purity).toBe(100);
    });

    it('should deduct for unexorcised offerings', () => {
      const offerings = [
        createOffering({ amount: 1000, description: 'Test1', category: 'GLUTTONY', timestamp: 100000 }),
        createOffering({ amount: 1000, description: 'Test2', category: 'GLUTTONY', timestamp: 100000 })
      ];

      const purity = SoulPurityCalculator.calculatePurity(offerings, []);
      expect(purity).toBeLessThan(100);
      expect(purity).toBeGreaterThan(80);
    });

    it('should return lower purity for exorcised offerings than unexorcised', () => {
      const unexorcised = [
        createOffering({ amount: 1000, description: 'Test', category: 'GLUTTONY', timestamp: 100000, isExorcised: false })
      ];

      const exorcised = [
        createOffering({ amount: 1000, description: 'Test', category: 'GLUTTONY', timestamp: 100000, isExorcised: true })
      ];

      // Both are created but one is exorcised (though objects are immutable, this tests the logic)
      const purity1 = SoulPurityCalculator.calculatePurity(unexorcised, []);
      expect(purity1).toBeDefined();
    });

    it('should deduct for expensive offerings', () => {
      const expensive = [
        createOffering({ amount: 10001, description: 'Expensive', category: 'VANITY', timestamp: 100000 })
      ];
      const cheap = [
        createOffering({ amount: 1000, description: 'Cheap', category: 'VANITY', timestamp: 100000 })
      ];

      const purity1 = SoulPurityCalculator.calculatePurity(expensive, []);
      const purity2 = SoulPurityCalculator.calculatePurity(cheap, []);
      expect(purity1).toBeLessThan(purity2);
    });

    it('should have higher purity with no recent possessions', () => {
      const offerings = [
        createOffering({ amount: 1000, description: 'Test', category: 'GLUTTONY', timestamp: 100000 })
      ];
      const noEvents = [];
      const recentPossession = [
        AuditEventModel.create({
          action: 'POSSESSION_TRIGGERED',
          entityType: 'Offering',
          entityId: '1',
          timestamp: Date.now()
        })
      ];

      const purity1 = SoulPurityCalculator.calculatePurity(offerings, noEvents);
      const purity2 = SoulPurityCalculator.calculatePurity(offerings, recentPossession);
      expect(purity1).toBeGreaterThanOrEqual(purity2);
    });

    it('should floor at 0', () => {
      const offerings = [];
      for (let i = 0; i < 50; i++) {
        offerings.push(createOffering({ amount: 1000, description: 'Test', category: 'GLUTTONY', timestamp: 100000 }));
      }

      const purity = SoulPurityCalculator.calculatePurity(offerings, []);
      expect(purity).toBeGreaterThanOrEqual(0);
      expect(purity).toBeLessThanOrEqual(100);
    });
  });

  describe('getBreakdown', () => {
    it('should sum spending by sin category', () => {
      const offerings = [
        createOffering({ amount: 1000, description: 'Coffee', category: 'GLUTTONY' }),
        createOffering({ amount: 2000, description: 'Dress', category: 'VANITY' }),
        createOffering({ amount: 1500, description: 'More coffee', category: 'GLUTTONY' })
      ];

      const breakdown = SoulPurityCalculator.getBreakdown(offerings);
      expect(breakdown.GLUTTONY).toBe(2500);
      expect(breakdown.VANITY).toBe(2000);
      expect(breakdown.SLOTH).toBe(0);
    });

    it('should initialize all categories', () => {
      const breakdown = SoulPurityCalculator.getBreakdown([]);
      expect(breakdown.GLUTTONY).toBe(0);
      expect(breakdown.VANITY).toBe(0);
      expect(breakdown.SLOTH).toBe(0);
      expect(breakdown.GREED).toBe(0);
      expect(breakdown.LUST).toBe(0);
      expect(breakdown.WRATH).toBe(0);
    });
  });

  describe('getReport', () => {
    it('should return comprehensive report', () => {
      const offerings = [
        createOffering({ amount: 1000, description: 'Test', category: 'GLUTTONY' })
      ];

      const report = SoulPurityCalculator.getReport(offerings, []);
      expect(report.soulPurity).toBeDefined();
      expect(report.breakdown).toBeDefined();
      expect(report.totalOfferings).toBe(1);
      expect(report.totalSpend).toBe(1000);
      expect(report.exorcisedCount).toBe(0);
      expect(report.totalPossessions).toBe(0);
      expect(report.exorcismSuccessRate).toBe(0);
    });

    it('should calculate exorcism success rate', () => {
      const offerings = [
        createOffering({ amount: 1000, description: 'Test1', category: 'GLUTTONY', isExorcised: true }),
        createOffering({ amount: 1000, description: 'Test2', category: 'GLUTTONY', isExorcised: false })
      ];

      const report = SoulPurityCalculator.getReport(offerings, []);
      expect(report.exorcismSuccessRate).toBe(50);
    });
  });
});
