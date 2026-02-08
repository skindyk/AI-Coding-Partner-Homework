'use strict';

const Demon = require('../../src/models/Demon');

describe('Demon', () => {
  describe('create', () => {
    it('should create a valid demon', () => {
      const demon = Demon.create({
        name: 'Test Demon',
        title: 'The Tester',
        triggerFn: () => true,
        ritualType: 'MANTRA',
        ritualConfig: { targetString: 'test', repetitions: 1 },
        punishmentMessage: 'You have been tested'
      });

      expect(demon.id).toBeDefined();
      expect(demon.name).toBe('Test Demon');
      expect(demon.title).toBe('The Tester');
      expect(demon.ritualType).toBe('MANTRA');
      expect(demon.punishmentMessage).toBe('You have been tested');
    });

    it('should throw if name is missing', () => {
      expect(() => {
        Demon.create({
          title: 'Test',
          triggerFn: () => true,
          ritualType: 'MANTRA',
          ritualConfig: {},
          punishmentMessage: 'Test'
        });
      }).toThrow('name is required');
    });

    it('should throw if title is missing', () => {
      expect(() => {
        Demon.create({
          name: 'Test',
          triggerFn: () => true,
          ritualType: 'MANTRA',
          ritualConfig: {},
          punishmentMessage: 'Test'
        });
      }).toThrow('title is required');
    });

    it('should throw if triggerFn is not a function', () => {
      expect(() => {
        Demon.create({
          name: 'Test',
          title: 'Test',
          triggerFn: 'not a function',
          ritualType: 'MANTRA',
          ritualConfig: {},
          punishmentMessage: 'Test'
        });
      }).toThrow('triggerFn must be a function');
    });

    it('should throw if ritualType is invalid', () => {
      expect(() => {
        Demon.create({
          name: 'Test',
          title: 'Test',
          triggerFn: () => true,
          ritualType: 'INVALID',
          ritualConfig: {},
          punishmentMessage: 'Test'
        });
      }).toThrow('Ritual type must be one of');
    });

    it('should throw if ritualConfig is missing', () => {
      expect(() => {
        Demon.create({
          name: 'Test',
          title: 'Test',
          triggerFn: () => true,
          ritualType: 'MANTRA',
          punishmentMessage: 'Test'
        });
      }).toThrow('ritualConfig must be an object');
    });

    it('should throw if punishmentMessage is missing', () => {
      expect(() => {
        Demon.create({
          name: 'Test',
          title: 'Test',
          triggerFn: () => true,
          ritualType: 'MANTRA',
          ritualConfig: {}
        });
      }).toThrow('punishmentMessage is required');
    });

    it('should freeze the demon object', () => {
      const demon = Demon.create({
        name: 'Test',
        title: 'Test',
        triggerFn: () => true,
        ritualType: 'MANTRA',
        ritualConfig: { test: 'value' },
        punishmentMessage: 'Test'
      });

      expect(() => {
        demon.name = 'Changed';
      }).toThrow();
    });

    it('should freeze ritualConfig', () => {
      const demon = Demon.create({
        name: 'Test',
        title: 'Test',
        triggerFn: () => true,
        ritualType: 'MANTRA',
        ritualConfig: { test: 'value' },
        punishmentMessage: 'Test'
      });

      expect(() => {
        demon.ritualConfig.test = 'changed';
      }).toThrow();
    });
  });

  describe('RITUAL_TYPES', () => {
    it('should have all ritual types', () => {
      const types = Object.values(Demon.RITUAL_TYPES);
      expect(types).toContain('MANTRA');
      expect(types).toContain('MATH');
      expect(types).toContain('WAIT');
      expect(types).toContain('SHAME');
    });
  });
});
