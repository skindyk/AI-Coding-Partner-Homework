'use strict';

const {
  validateAmount,
  validateDescription,
  validateCategory,
  validateRitualType
} = require('../../src/utils/validators');

describe('validators utility', () => {
  describe('validateAmount', () => {
    it('should accept valid amount', () => {
      const result = validateAmount(1000);
      expect(result.valid).toBe(true);
    });

    it('should reject non-integer', () => {
      const result = validateAmount(10.5);
      expect(result.valid).toBe(false);
    });

    it('should reject negative amount', () => {
      const result = validateAmount(-100);
      expect(result.valid).toBe(false);
    });

    it('should reject zero', () => {
      const result = validateAmount(0);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateDescription', () => {
    it('should accept valid description', () => {
      const result = validateDescription('Coffee');
      expect(result.valid).toBe(true);
    });

    it('should reject empty string', () => {
      const result = validateDescription('');
      expect(result.valid).toBe(false);
    });

    it('should reject long description', () => {
      const long = 'a'.repeat(201);
      const result = validateDescription(long);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateCategory', () => {
    it('should accept valid categories', () => {
      const categories = ['GLUTTONY', 'VANITY', 'SLOTH', 'GREED', 'LUST', 'WRATH'];
      categories.forEach(cat => {
        const result = validateCategory(cat);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid category', () => {
      const result = validateCategory('INVALID');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateRitualType', () => {
    it('should accept valid ritual types', () => {
      const types = ['MANTRA', 'MATH', 'WAIT', 'SHAME'];
      types.forEach(type => {
        const result = validateRitualType(type);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid ritual type', () => {
      const result = validateRitualType('INVALID');
      expect(result.valid).toBe(false);
    });
  });
});
