'use strict';

const money = require('../../src/utils/money');

describe('money utility', () => {
  describe('toCents', () => {
    it('should convert dollar string to cents', () => {
      expect(money.toCents('12.99')).toBe(1299);
      expect(money.toCents('100')).toBe(10000);
      expect(money.toCents('0.01')).toBe(1);
    });

    it('should convert number to cents', () => {
      expect(money.toCents(12.99)).toBe(1299);
      expect(money.toCents(100)).toBe(10000);
    });

    it('should round to nearest cent', () => {
      expect(money.toCents(12.994)).toBe(1299);
      expect(money.toCents(12.995)).toBe(1300);
    });

    it('should throw on invalid input', () => {
      expect(() => money.toCents('invalid')).toThrow();
      expect(() => money.toCents({})).toThrow();
    });
  });

  describe('toDisplay', () => {
    it('should convert cents to display format', () => {
      expect(money.toDisplay(1299)).toBe('$12.99');
      expect(money.toDisplay(10000)).toBe('$100.00');
      expect(money.toDisplay(1)).toBe('$0.01');
    });

    it('should handle zero', () => {
      expect(money.toDisplay(0)).toBe('$0.00');
    });

    it('should support without symbol', () => {
      expect(money.toDisplay(1299, false)).toBe('12.99');
    });

    it('should throw on invalid input', () => {
      expect(() => money.toDisplay(12.5)).toThrow();
      expect(() => money.toDisplay('100')).toThrow();
    });
  });

  describe('add', () => {
    it('should add two amounts in cents', () => {
      expect(money.add(1000, 500)).toBe(1500);
      expect(money.add(0, 1000)).toBe(1000);
    });
  });

  describe('subtract', () => {
    it('should subtract two amounts in cents', () => {
      expect(money.subtract(1500, 500)).toBe(1000);
      expect(money.subtract(1000, 1000)).toBe(0);
    });
  });

  describe('round trip', () => {
    it('should convert back and forth correctly', () => {
      const original = '99.99';
      const cents = money.toCents(original);
      const display = money.toDisplay(cents, false);
      expect(display).toBe('99.99');
    });
  });
});
