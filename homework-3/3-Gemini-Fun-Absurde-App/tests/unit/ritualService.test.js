'use strict';

const { createRitualService, RITUAL_STATES } = require('../../src/services/RitualService');
const { create: createDemon } = require('../../src/models/Demon');
const { RITUAL_TYPES } = require('../../src/models/Demon');

describe('RitualService', () => {
  let ritual;

  beforeEach(() => {
    ritual = createRitualService();
  });

  describe('MANTRA ritual', () => {
    let mantraDemon;

    beforeEach(() => {
      mantraDemon = createDemon({
        name: 'Test Demon',
        title: 'Test',
        triggerFn: () => true,
        ritualType: RITUAL_TYPES.MANTRA,
        ritualConfig: { targetString: 'I am not my fabric', repetitions: 3 },
        punishmentMessage: 'Test'
      });

      ritual.startRitual(mantraDemon);
    });

    it('should start a mantra ritual', () => {
      const state = ritual.getRitualState();
      expect(state.state).toBe(RITUAL_STATES.IN_PROGRESS);
      expect(state.ritualType).toBe(RITUAL_TYPES.MANTRA);
      expect(state.mantraProgress).toBe(0);
      expect(state.mantraTarget).toBe(3);
    });

    it('should increment progress on correct mantra', () => {
      ritual.submitMantra('I am not my fabric');
      const state = ritual.getRitualState();
      expect(state.mantraProgress).toBe(1);
    });

    it('should reset progress on incorrect mantra', () => {
      ritual.submitMantra('I am not my fabric');
      ritual.submitMantra('wrong');
      const state = ritual.getRitualState();
      expect(state.mantraProgress).toBe(0);
    });

    it('should complete ritual after enough correct mantras', () => {
      ritual.submitMantra('I am not my fabric');
      ritual.submitMantra('I am not my fabric');
      ritual.submitMantra('I am not my fabric');
      expect(ritual.isComplete()).toBe(true);
    });

    it('should be case-insensitive', () => {
      ritual.submitMantra('I AM NOT MY FABRIC');
      const state = ritual.getRitualState();
      expect(state.mantraProgress).toBe(1);
    });
  });

  describe('MATH ritual', () => {
    let mathDemon;

    beforeEach(() => {
      mathDemon = createDemon({
        name: 'Math Demon',
        title: 'Test',
        triggerFn: () => true,
        ritualType: RITUAL_TYPES.MATH,
        ritualConfig: { difficulty: 1, problemCount: 2 },
        punishmentMessage: 'Test'
      });

      ritual.startRitual(mathDemon);
    });

    it('should start a math ritual', () => {
      const state = ritual.getRitualState();
      expect(state.state).toBe(RITUAL_STATES.IN_PROGRESS);
      expect(state.ritualType).toBe(RITUAL_TYPES.MATH);
      expect(state.mathTotal).toBe(2);
      expect(state.currentProblem).toBeDefined();
    });

    it('should have at least one problem generated', () => {
      const state = ritual.getRitualState();
      expect(state.currentProblem).toBeDefined();
      if (state.currentProblem) {
        expect(typeof state.currentProblem).toBe('string');
      }
    });
  });

  describe('WAIT ritual', () => {
    let waitDemon;

    beforeEach(() => {
      waitDemon = createDemon({
        name: 'Wait Demon',
        title: 'Test',
        triggerFn: () => true,
        ritualType: RITUAL_TYPES.WAIT,
        ritualConfig: { durationSeconds: 2 },
        punishmentMessage: 'Test'
      });

      jest.useFakeTimers();
      ritual.startRitual(waitDemon);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should not be complete immediately', () => {
      expect(ritual.checkWaitComplete()).toBe(false);
    });

    it('should be complete after duration passes', () => {
      jest.advanceTimersByTime(2500);
      expect(ritual.checkWaitComplete()).toBe(true);
    });

    it('should return remaining time', () => {
      jest.advanceTimersByTime(1000);
      const state = ritual.getRitualState();
      expect(state.remainingMs).toBeLessThanOrEqual(1000);
    });
  });

  describe('SHAME ritual', () => {
    let shameDemon;

    beforeEach(() => {
      shameDemon = createDemon({
        name: 'Shame Demon',
        title: 'Test',
        triggerFn: () => true,
        ritualType: RITUAL_TYPES.SHAME,
        ritualConfig: { message: 'Confess' },
        punishmentMessage: 'Test'
      });

      ritual.startRitual(shameDemon);
    });

    it('should start a shame ritual', () => {
      const state = ritual.getRitualState();
      expect(state.state).toBe(RITUAL_STATES.IN_PROGRESS);
      expect(state.ritualType).toBe(RITUAL_TYPES.SHAME);
    });

    it('should reject response shorter than 10 characters', () => {
      const result = ritual.submitShameResponse('short');
      expect(result).toBe(false);
      expect(ritual.isComplete()).toBe(false);
    });

    it('should accept response with 10+ characters', () => {
      const result = ritual.submitShameResponse('This is my confession');
      expect(result).toBe(true);
      expect(ritual.isComplete()).toBe(true);
    });

    it('should trim whitespace from response', () => {
      const result = ritual.submitShameResponse('   exactly10ch   ');
      expect(result).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset ritual state', () => {
      const demon = createDemon({
        name: 'Test',
        title: 'Test',
        triggerFn: () => true,
        ritualType: RITUAL_TYPES.MANTRA,
        ritualConfig: { targetString: 'test', repetitions: 1 },
        punishmentMessage: 'Test'
      });

      ritual.startRitual(demon);
      ritual.reset();

      const state = ritual.getRitualState();
      expect(state.state).toBe(RITUAL_STATES.IDLE);
      expect(state.demon).toBeNull();
    });
  });
});
