'use strict';

const { createRitualService, RITUAL_STATES } = require('../../src/services/RitualService');
const { create: createDemon } = require('../../src/models/Demon');
const { RITUAL_TYPES } = require('../../src/models/Demon');

describe('RitualService - Comprehensive Branch Coverage', () => {
  let ritual;

  beforeEach(() => {
    ritual = createRitualService();
  });

  describe('Mantra ritual branches', () => {
    let mantraDemon;

    beforeEach(() => {
      mantraDemon = createDemon({
        name: 'Mantra Test',
        title: 'Test',
        triggerFn: () => true,
        ritualType: RITUAL_TYPES.MANTRA,
        ritualConfig: { targetString: 'test string', repetitions: 2 },
        punishmentMessage: 'Test'
      });
      ritual.startRitual(mantraDemon);
    });

    it('should handle multiple correct entries and complete', () => {
      ritual.submitMantra('test string');
      const state1 = ritual.getRitualState();
      expect(state1.mantraProgress).toBe(1);
      expect(state1.state).toBe(RITUAL_STATES.IN_PROGRESS);

      ritual.submitMantra('test string');
      const state2 = ritual.getRitualState();
      expect(state2.mantraProgress).toBe(2);
      expect(state2.state).toBe(RITUAL_STATES.COMPLETED);
      expect(ritual.isComplete()).toBe(true);
    });

    it('should reset on incorrect at any stage', () => {
      ritual.submitMantra('test string');
      ritual.submitMantra('test string');
      ritual.submitMantra('wrong');
      const state = ritual.getRitualState();
      expect(state.mantraProgress).toBe(0);
    });

    it('should handle lowercase mantra', () => {
      ritual.submitMantra('test string');
      expect(ritual.getRitualState().mantraProgress).toBe(1);
    });

    it('should handle uppercase mantra', () => {
      ritual.submitMantra('TEST STRING');
      expect(ritual.getRitualState().mantraProgress).toBe(1);
    });

    it('should handle mixed case mantra', () => {
      ritual.submitMantra('TeSt StRiNg');
      expect(ritual.getRitualState().mantraProgress).toBe(1);
    });
  });

  describe('Math ritual branches', () => {
    let mathDemon;

    beforeEach(() => {
      mathDemon = createDemon({
        name: 'Math Test',
        title: 'Test',
        triggerFn: () => true,
        ritualType: RITUAL_TYPES.MATH,
        ritualConfig: { difficulty: 1, problemCount: 1 },
        punishmentMessage: 'Test'
      });
      ritual.startRitual(mathDemon);
    });

    it('should generate difficulty 1 problems (addition)', () => {
      const state = ritual.getRitualState();
      expect(state.currentProblem).toBeDefined();
      expect(state.currentProblem.problem).toMatch(/\+/);
    });

    it('should generate difficulty 2 problems', () => {
      const demon2 = createDemon({
        name: 'Math2',
        title: 'Test',
        triggerFn: () => true,
        ritualType: RITUAL_TYPES.MATH,
        ritualConfig: { difficulty: 2, problemCount: 1 },
        punishmentMessage: 'Test'
      });
      ritual.reset();
      ritual.startRitual(demon2);

      const state = ritual.getRitualState();
      expect(state.currentProblem.problem).toMatch(/×/);
    });

    it('should generate difficulty 3 problems', () => {
      const demon3 = createDemon({
        name: 'Math3',
        title: 'Test',
        triggerFn: () => true,
        ritualType: RITUAL_TYPES.MATH,
        ritualConfig: { difficulty: 3, problemCount: 1 },
        punishmentMessage: 'Test'
      });
      ritual.reset();
      ritual.startRitual(demon3);

      const state = ritual.getRitualState();
      expect(state.currentProblem.problem).toMatch(/% of/);
    });
  });

  describe('Wait ritual branches', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should show remaining time correctly', () => {
      const waitDemon = createDemon({
        name: 'Wait',
        title: 'Test',
        triggerFn: () => true,
        ritualType: RITUAL_TYPES.WAIT,
        ritualConfig: { durationSeconds: 5 },
        punishmentMessage: 'Test'
      });

      ritual.startRitual(waitDemon);

      const state1 = ritual.getRitualState();
      expect(state1.remainingMs).toBeCloseTo(5000, -3);

      jest.advanceTimersByTime(2000);
      const state2 = ritual.getRitualState();
      expect(state2.remainingMs).toBeCloseTo(3000, -3);

      jest.advanceTimersByTime(2500);
      const state3 = ritual.getRitualState();
      expect(state3.remainingMs).toBeLessThanOrEqual(500);
    });

    it('should handle exact completion time', () => {
      const waitDemon = createDemon({
        name: 'Wait',
        title: 'Test',
        triggerFn: () => true,
        ritualType: RITUAL_TYPES.WAIT,
        ritualConfig: { durationSeconds: 2 },
        punishmentMessage: 'Test'
      });

      ritual.startRitual(waitDemon);
      jest.advanceTimersByTime(2000);
      const isComplete = ritual.checkWaitComplete();
      expect(isComplete).toBe(true);
      expect(ritual.isComplete()).toBe(true);
    });
  });

  describe('Shame ritual branches', () => {
    let shameDemon;

    beforeEach(() => {
      shameDemon = createDemon({
        name: 'Shame',
        title: 'Test',
        triggerFn: () => true,
        ritualType: RITUAL_TYPES.SHAME,
        ritualConfig: { message: 'Test' },
        punishmentMessage: 'Test'
      });
      ritual.startRitual(shameDemon);
    });

    it('should accept exactly 10 characters', () => {
      const result = ritual.submitShameResponse('exactly10c');
      expect(result).toBe(true);
      expect(ritual.isComplete()).toBe(true);
    });

    it('should accept more than 10 characters', () => {
      const result = ritual.submitShameResponse('this is way more than 10 characters');
      expect(result).toBe(true);
    });

    it('should reject exactly 9 characters', () => {
      const result = ritual.submitShameResponse('exactly9ch');
      expect(result).toBe(false);
    });

    it('should trim whitespace and check length', () => {
      const result = ritual.submitShameResponse('   exactly10c   ');
      expect(result).toBe(true);
    });

    it('should fail with only whitespace', () => {
      const result = ritual.submitShameResponse('     ');
      expect(result).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should throw when submitting mantra without starting ritual', () => {
      expect(() => {
        ritual.submitMantra('test');
      }).toThrow('Not in MANTRA ritual');
    });

    it('should throw when submitting math without starting ritual', () => {
      expect(() => {
        ritual.submitMathAnswer('5');
      }).toThrow('Not in MATH ritual');
    });

    it('should throw when checking wait without starting ritual', () => {
      expect(() => {
        ritual.checkWaitComplete();
      }).toThrow('Not in WAIT ritual');
    });

    it('should throw when getting wait remaining without wait ritual', () => {
      expect(() => {
        ritual.getWaitRemaining();
      }).toThrow('Not in WAIT ritual');
    });

    it('should throw when submitting shame without starting ritual', () => {
      expect(() => {
        ritual.submitShameResponse('test');
      }).toThrow('Not in SHAME ritual');
    });

    it('should throw when starting ritual without demon', () => {
      expect(() => {
        ritual.startRitual(null);
      }).toThrow('Demon required');
    });
  });
});
