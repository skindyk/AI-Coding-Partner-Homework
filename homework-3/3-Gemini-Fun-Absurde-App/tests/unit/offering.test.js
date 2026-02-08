'use strict';

const Offering = require('../../src/models/Offering');

describe('Offering', () => {
  describe('create', () => {
    it('should create a valid offering', () => {
      const offering = Offering.create({
        amount: 1000,
        description: 'Coffee',
        category: 'GLUTTONY'
      });

      expect(offering.id).toBeDefined();
      expect(offering.amount).toBe(1000);
      expect(offering.description).toBe('Coffee');
      expect(offering.category).toBe('GLUTTONY');
      expect(offering.isExorcised).toBe(false);
      expect(offering.timestamp).toBeDefined();
    });

    it('should throw if amount is not an integer', () => {
      expect(() => {
        Offering.create({
          amount: 10.5,
          description: 'Test',
          category: 'GLUTTONY'
        });
      }).toThrow('Amount must be an integer');
    });

    it('should throw if amount is negative', () => {
      expect(() => {
        Offering.create({
          amount: -100,
          description: 'Test',
          category: 'GLUTTONY'
        });
      }).toThrow('Amount must be positive');
    });

    it('should throw if amount is zero', () => {
      expect(() => {
        Offering.create({
          amount: 0,
          description: 'Test',
          category: 'GLUTTONY'
        });
      }).toThrow('Amount must be positive');
    });

    it('should throw if description is missing', () => {
      expect(() => {
        Offering.create({
          amount: 1000,
          category: 'GLUTTONY'
        });
      }).toThrow('Description is required');
    });

    it('should throw if description is empty string', () => {
      expect(() => {
        Offering.create({
          amount: 1000,
          description: '',
          category: 'GLUTTONY'
        });
      }).toThrow('Description is required');
    });

    it('should throw if description exceeds 200 characters', () => {
      const longDesc = 'a'.repeat(201);
      expect(() => {
        Offering.create({
          amount: 1000,
          description: longDesc,
          category: 'GLUTTONY'
        });
      }).toThrow('Description must not exceed 200 characters');
    });

    it('should throw if category is invalid', () => {
      expect(() => {
        Offering.create({
          amount: 1000,
          description: 'Test',
          category: 'INVALID'
        });
      }).toThrow('Category must be one of');
    });

    it('should accept pre-sanitised description from middleware', () => {
      // Sanitization is handled by middleware, so the model receives already-sanitized input
      const sanitisedDescription = '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;';
      const offering = Offering.create({
        amount: 1000,
        description: sanitisedDescription,
        category: 'GLUTTONY'
      });

      expect(offering.description).toBe(sanitisedDescription);
      expect(offering.description).toContain('&lt;');
    });

    it('should accept custom timestamp', () => {
      const timestamp = 1000000;
      const offering = Offering.create({
        amount: 1000,
        description: 'Test',
        category: 'GLUTTONY',
        timestamp
      });

      expect(offering.timestamp).toBe(timestamp);
    });

    it('should accept isExorcised flag', () => {
      const offering = Offering.create({
        amount: 1000,
        description: 'Test',
        category: 'GLUTTONY',
        isExorcised: true
      });

      expect(offering.isExorcised).toBe(true);
    });

    it('should freeze the offering object', () => {
      const offering = Offering.create({
        amount: 1000,
        description: 'Test',
        category: 'GLUTTONY'
      });

      expect(() => {
        offering.amount = 2000;
      }).toThrow();
    });
  });

  describe('SIN_CATEGORIES', () => {
    it('should have all six sin categories', () => {
      const categories = Object.values(Offering.SIN_CATEGORIES);
      expect(categories).toContain('GLUTTONY');
      expect(categories).toContain('VANITY');
      expect(categories).toContain('SLOTH');
      expect(categories).toContain('GREED');
      expect(categories).toContain('LUST');
      expect(categories).toContain('WRATH');
    });
  });
});
