'use strict';

const { RITUAL_TYPES } = require('../models/Demon');
const { AUDIT_ACTIONS } = require('../models/AuditEvent');

const RITUAL_STATES = Object.freeze({
  IDLE: 'IDLE',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
});

/**
 * Generates random arithmetic problems
 * @param {number} difficulty - Difficulty level (1-3)
 * @param {function} random - Optional random function (defaults to Math.random)
 * @returns {object} Problem object with problem string and answer
 */
function generateProblem(difficulty, random = null) {
  const rng = random !== null ? random : Math.random;
  let a, b, operator, answer;

  if (difficulty === 1) {
    // Addition/subtraction up to 100
    a = Math.floor(rng() * 100);
    b = Math.floor(rng() * 100);
    operator = rng() < 0.5 ? '+' : '-';
    answer = operator === '+' ? a + b : a - b;
  } else if (difficulty === 2) {
    // Multiplication up to 12×12
    a = Math.floor(rng() * 13);
    b = Math.floor(rng() * 13);
    operator = '×';
    answer = a * b;
  } else if (difficulty === 3) {
    // Percentage calculation
    a = Math.floor(rng() * 100) + 1; // percentage 1-100
    b = Math.floor(rng() * 10000) + 100; // base 100-10100
    operator = '% of';
    answer = Math.floor((a / 100) * b);
  }

  return {
    problem: `${a} ${operator} ${b}`,
    answer
  };
}

/**
 * Ritual Service - Manages ritual completion state machine
 */
class RitualService {
  constructor(auditLogger = null, randomFn = null) {
    this.auditLogger = auditLogger;
    this.randomFn = randomFn;
    this.resetState();
  }

  resetState() {
    this.state = RITUAL_STATES.IDLE;
    this.demon = null;
    this.startedAt = null;
    this.mantraProgress = 0;
    this.mantraTarget = 0;
    this.mathProblems = [];
    this.mathCorrect = 0;
    this.shameText = '';
  }

  /**
   * Start a ritual for a demon
   * @param {object} demon - The demon to perform ritual for
   * @param {number} currentTime - Optional current time in milliseconds (defaults to Date.now())
   */
  startRitual(demon, currentTime = null) {
    if (!demon) {
      throw new Error('Demon required');
    }

    this.state = RITUAL_STATES.IN_PROGRESS;
    this.demon = demon;
    this.startedAt = currentTime !== null ? currentTime : Date.now();

    if (demon.ritualType === RITUAL_TYPES.MANTRA) {
      this.mantraProgress = 0;
      this.mantraTarget = demon.ritualConfig.repetitions;
    } else if (demon.ritualType === RITUAL_TYPES.MATH) {
      this.mathProblems = [];
      this.mathCorrect = 0;
      for (let i = 0; i < demon.ritualConfig.problemCount; i++) {
        this.mathProblems.push(generateProblem(demon.ritualConfig.difficulty, this.randomFn));
      }
    } else if (demon.ritualType === RITUAL_TYPES.WAIT) {
      // Nothing special for WAIT
    } else if (demon.ritualType === RITUAL_TYPES.SHAME) {
      this.shameText = '';
    }

    if (this.auditLogger) {
      this.auditLogger.log(
        AUDIT_ACTIONS.RITUAL_STARTED,
        'Ritual',
        `${demon.id}`,
        null,
        { demonName: demon.name, ritualType: demon.ritualType }
      );
    }
  }

  /**
   * Submit a mantra entry
   * @returns {object} { correct: boolean, progress: number, target: number }
   */
  submitMantra(input) {
    if (!this.demon || this.demon.ritualType !== RITUAL_TYPES.MANTRA) {
      throw new Error('Not in MANTRA ritual');
    }

    const target = this.demon.ritualConfig.targetString;
    const userInput = input.trim();

    if (userInput.toLowerCase() === target.toLowerCase()) {
      this.mantraProgress++;

      if (this.mantraProgress >= this.mantraTarget) {
        this.state = RITUAL_STATES.COMPLETED;
        if (this.auditLogger) {
          this.auditLogger.log(
            AUDIT_ACTIONS.RITUAL_COMPLETED,
            'Ritual',
            `${this.demon.id}`,
            null,
            { demonName: this.demon.name, ritualType: RITUAL_TYPES.MANTRA }
          );
        }
      }

      return { correct: true, progress: this.mantraProgress, target: this.mantraTarget };
    } else {
      // Typo - reset progress
      this.mantraProgress = 0;

      if (this.auditLogger) {
        this.auditLogger.log(
          AUDIT_ACTIONS.RITUAL_FAILED,
          'Ritual',
          `${this.demon.id}`,
          null,
          { demonName: this.demon.name, reason: 'Mantra typo' }
        );
      }

      return { correct: false, progress: this.mantraProgress, target: this.mantraTarget };
    }
  }

  /**
   * Submit a math answer
   * @returns {object} { correct: boolean, progress: number, total: number, problem: string|null }
   */
  submitMathAnswer(answerStr) {
    if (!this.demon || this.demon.ritualType !== RITUAL_TYPES.MATH) {
      throw new Error('Not in MATH ritual');
    }

    const answer = parseInt(answerStr, 10);
    const currentProblem = this.mathProblems[this.mathCorrect];

    if (!currentProblem) {
      throw new Error('No more problems');
    }

    if (answer === currentProblem.answer) {
      this.mathCorrect++;

      if (this.mathCorrect >= this.mathProblems.length) {
        this.state = RITUAL_STATES.COMPLETED;
        if (this.auditLogger) {
          this.auditLogger.log(
            AUDIT_ACTIONS.RITUAL_COMPLETED,
            'Ritual',
            `${this.demon.id}`,
            null,
            { demonName: this.demon.name, ritualType: RITUAL_TYPES.MATH }
          );
        }
        return { correct: true, progress: this.mathCorrect, total: this.mathProblems.length, problem: null };
      } else {
        return { correct: true, progress: this.mathCorrect, total: this.mathProblems.length, problem: this.mathProblems[this.mathCorrect].problem };
      }
    } else {
      // Wrong answer - regenerate this problem
      if (this.auditLogger) {
        this.auditLogger.log(
          AUDIT_ACTIONS.RITUAL_FAILED,
          'Ritual',
          `${this.demon.id}`,
          null,
          { demonName: this.demon.name, reason: 'Wrong math answer' }
        );
      }

      this.mathProblems[this.mathCorrect] = generateProblem(this.demon.ritualConfig.difficulty, this.randomFn);
      return { correct: false, progress: this.mathCorrect, total: this.mathProblems.length, problem: this.mathProblems[this.mathCorrect].problem };
    }
  }

  /**
   * Check if WAIT ritual is complete
   * @returns {boolean} True if elapsed time >= duration
   */
  checkWaitComplete() {
    if (!this.demon || this.demon.ritualType !== RITUAL_TYPES.WAIT) {
      throw new Error('Not in WAIT ritual');
    }

    const elapsedSeconds = (Date.now() - this.startedAt) / 1000;
    const durationSeconds = this.demon.ritualConfig.durationSeconds;

    if (elapsedSeconds >= durationSeconds) {
      this.state = RITUAL_STATES.COMPLETED;

      if (this.auditLogger) {
        this.auditLogger.log(
          AUDIT_ACTIONS.RITUAL_COMPLETED,
          'Ritual',
          `${this.demon.id}`,
          null,
          { demonName: this.demon.name, ritualType: RITUAL_TYPES.WAIT }
        );
      }

      return true;
    }

    return false;
  }

  /**
   * Get remaining wait time in milliseconds
   */
  getWaitRemaining() {
    if (!this.demon || this.demon.ritualType !== RITUAL_TYPES.WAIT) {
      throw new Error('Not in WAIT ritual');
    }

    const elapsedMs = Date.now() - this.startedAt;
    const totalMs = this.demon.ritualConfig.durationSeconds * 1000;
    return Math.max(0, totalMs - elapsedMs);
  }

  /**
   * Submit SHAME response
   * @returns {boolean} True if valid
   */
  submitShameResponse(text) {
    if (!this.demon || this.demon.ritualType !== RITUAL_TYPES.SHAME) {
      throw new Error('Not in SHAME ritual');
    }

    const trimmed = text.trim();
    if (trimmed.length >= 10) {
      this.state = RITUAL_STATES.COMPLETED;
      this.shameText = trimmed;

      if (this.auditLogger) {
        this.auditLogger.log(
          AUDIT_ACTIONS.RITUAL_COMPLETED,
          'Ritual',
          `${this.demon.id}`,
          null,
          { demonName: this.demon.name, ritualType: RITUAL_TYPES.SHAME }
        );
      }

      return true;
    }

    if (this.auditLogger) {
      this.auditLogger.log(
        AUDIT_ACTIONS.RITUAL_FAILED,
        'Ritual',
        `${this.demon.id}`,
        null,
        { demonName: this.demon.name, reason: 'Shame response too short' }
      );
    }

    return false;
  }

  /**
   * Get current ritual state
   */
  getRitualState() {
    return {
      state: this.state,
      demon: this.demon,
      ritualType: this.demon ? this.demon.ritualType : null,
      startedAt: this.startedAt,
      ...(this.demon && this.demon.ritualType === RITUAL_TYPES.MANTRA && {
        mantraProgress: this.mantraProgress,
        mantraTarget: this.mantraTarget
      }),
      ...(this.demon && this.demon.ritualType === RITUAL_TYPES.MATH && {
        mathCorrect: this.mathCorrect,
        mathTotal: this.mathProblems.length,
        currentProblem: this.mathProblems[this.mathCorrect]?.problem || null
      }),
      ...(this.demon && this.demon.ritualType === RITUAL_TYPES.WAIT && {
        remainingMs: this.getWaitRemaining()
      })
    };
  }

  /**
   * Reset ritual (for testing or new ritual)
   */
  reset() {
    this.resetState();
  }

  /**
   * Check if ritual is complete
   */
  isComplete() {
    return this.state === RITUAL_STATES.COMPLETED;
  }
}

/**
 * Factory function to create a fresh RitualService instance
 */
function createRitualService(auditLogger = null, randomFn = null) {
  return new RitualService(auditLogger, randomFn);
}

module.exports = {
  RitualService,
  createRitualService,
  RITUAL_STATES
};
