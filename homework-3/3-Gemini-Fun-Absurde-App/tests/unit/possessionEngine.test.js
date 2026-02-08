'use strict';

const { createPossessionEngine } = require('../../src/services/PossessionEngine');
const { create: createDemon } = require('../../src/models/Demon');
const { create: createOffering, SIN_CATEGORIES } = require('../../src/models/Offering');
const { RITUAL_TYPES } = require('../../src/models/Demon');

describe('PossessionEngine', () => {
  let engine;
  let demons;
  let vagueZul;

  beforeEach(() => {
    // Create Vogue-Zul demon (VANITY > $50)
    vagueZul = createDemon({
      name: 'Vogue-Zul',
      title: 'Demon of Vanity',
      triggerFn: (offering) => offering.category === SIN_CATEGORIES.VANITY && offering.amount > 5000,
      ritualType: RITUAL_TYPES.MANTRA,
      ritualConfig: { targetString: 'test', repetitions: 1 },
      punishmentMessage: 'Test'
    });

    demons = [vagueZul];
    engine = createPossessionEngine(demons);
  });

  describe('checkPossession', () => {
    it('should trigger possession when demon condition matches', () => {
      const offering = createOffering({
        amount: 10000,
        description: 'Expensive dress',
        category: SIN_CATEGORIES.VANITY
      });

      const possession = engine.checkPossession(offering, []);
      expect(possession).toEqual(vagueZul);
      expect(engine.isCurrentlyPossessed()).toBe(true);
    });

    it('should not trigger possession when conditions do not match', () => {
      const offering = createOffering({
        amount: 1000,
        description: 'Cheap item',
        category: SIN_CATEGORIES.VANITY
      });

      const possession = engine.checkPossession(offering, []);
      expect(possession).toBeNull();
      expect(engine.isCurrentlyPossessed()).toBe(false);
    });

    it('should not re-evaluate when already possessed', () => {
      const offering1 = createOffering({
        amount: 10000,
        description: 'Expensive dress',
        category: SIN_CATEGORIES.VANITY
      });

      const offering2 = createOffering({
        amount: 20000,
        description: 'More expensive',
        category: SIN_CATEGORIES.VANITY
      });

      engine.checkPossession(offering1, []);
      const secondCheck = engine.checkPossession(offering2, [offering1]);
      expect(secondCheck).toEqual(vagueZul); // Same demon, not re-evaluated
    });

    it('should return null if no demons match', () => {
      const offering = createOffering({
        amount: 1000,
        description: 'Cheap food',
        category: SIN_CATEGORIES.GLUTTONY
      });

      const possession = engine.checkPossession(offering, []);
      expect(possession).toBeNull();
    });
  });

  describe('getActivePossession', () => {
    it('should return current demon', () => {
      const offering = createOffering({
        amount: 10000,
        description: 'Test',
        category: SIN_CATEGORIES.VANITY
      });

      engine.checkPossession(offering, []);
      const active = engine.getActivePossession();
      expect(active).toEqual(vagueZul);
    });

    it('should return null if not possessed', () => {
      const active = engine.getActivePossession();
      expect(active).toBeNull();
    });
  });

  describe('clearPossession', () => {
    it('should clear active possession', () => {
      const offering = createOffering({
        amount: 10000,
        description: 'Test',
        category: SIN_CATEGORIES.VANITY
      });

      engine.checkPossession(offering, []);
      expect(engine.isCurrentlyPossessed()).toBe(true);

      engine.clearPossession(offering.id);
      expect(engine.isCurrentlyPossessed()).toBe(false);
      expect(engine.getActivePossession()).toBeNull();
    });
  });

  describe('isCurrentlyPossessed', () => {
    it('should return true when possessed', () => {
      const offering = createOffering({
        amount: 10000,
        description: 'Test',
        category: SIN_CATEGORIES.VANITY
      });

      engine.checkPossession(offering, []);
      expect(engine.isCurrentlyPossessed()).toBe(true);
    });

    it('should return false when not possessed', () => {
      expect(engine.isCurrentlyPossessed()).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset engine state', () => {
      const offering = createOffering({
        amount: 10000,
        description: 'Test',
        category: SIN_CATEGORIES.VANITY
      });

      engine.checkPossession(offering, []);
      engine.reset();
      expect(engine.isCurrentlyPossessed()).toBe(false);
    });
  });

  describe('with multiple demons', () => {
    it('should return first matching demon', () => {
      const demon2 = createDemon({
        name: 'Gluttonous Rex',
        title: 'Demon of Gluttony',
        triggerFn: (offering) => offering.category === SIN_CATEGORIES.GLUTTONY,
        ritualType: RITUAL_TYPES.MATH,
        ritualConfig: { difficulty: 1, problemCount: 1 },
        punishmentMessage: 'Test'
      });

      const multiDemon = createPossessionEngine([vagueZul, demon2]);

      // Create offering that matches both demons (but Vogue-Zul is first)
      const offering = createOffering({
        amount: 10000,
        description: 'Vanity item',
        category: SIN_CATEGORIES.VANITY
      });

      const possession = multiDemon.checkPossession(offering, []);
      expect(possession.name).toBe('Vogue-Zul');
    });
  });
});
