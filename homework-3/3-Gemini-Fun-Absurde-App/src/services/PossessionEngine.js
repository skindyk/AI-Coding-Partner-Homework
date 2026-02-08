'use strict';

const { AUDIT_ACTIONS } = require('../models/AuditEvent');

/**
 * Possession Engine - Manages demon possession state and trigger evaluation
 */
class PossessionEngine {
  constructor(demons = [], auditLogger = null) {
    this.demons = demons;
    this.auditLogger = auditLogger;
    this.currentDemon = null;
  }

  /**
   * Check if a new offering triggers possession
   * @param {object} offering - New offering to check
   * @param {array} history - All previous offerings
   * @returns {object|null} The triggering demon or null
   */
  checkPossession(offering, history) {
    // If already possessed, don't re-evaluate
    if (this.currentDemon) {
      return this.currentDemon;
    }

    // Evaluate demons in order; first match wins
    for (const demon of this.demons) {
      try {
        if (demon.triggerFn(offering, history)) {
          this.currentDemon = demon;

          // Log possession triggered
          if (this.auditLogger) {
            this.auditLogger.log(
              AUDIT_ACTIONS.POSSESSION_TRIGGERED,
              'Offering',
              offering.id,
              null,
              { demonId: demon.id, demonName: demon.name }
            );
          }

          return demon;
        }
      } catch (err) {
        // Silently skip demons with broken triggers
        console.error(`[PossessionEngine] Demon ${demon.name} trigger error:`, err.message);
      }
    }

    return null;
  }

  /**
   * Get the currently active possession
   * @returns {object|null} Current demon or null
   */
  getActivePossession() {
    return this.currentDemon;
  }

  /**
   * Clear the active possession
   * @param {object} offeringId - ID of the offering being exorcised
   */
  clearPossession(offeringId) {
    if (this.currentDemon) {
      const demon = this.currentDemon;
      this.currentDemon = null;

      // Log possession cleared
      if (this.auditLogger) {
        this.auditLogger.log(
          AUDIT_ACTIONS.POSSESSION_CLEARED,
          'Offering',
          offeringId,
          { demonId: demon.id, demonName: demon.name },
          null
        );
      }
    }
  }

  /**
   * Check if user is currently possessed
   * @returns {boolean}
   */
  isCurrentlyPossessed() {
    return this.currentDemon !== null;
  }

  /**
   * Reset the engine state (for testing)
   */
  reset() {
    this.currentDemon = null;
  }
}

/**
 * Factory function to create a fresh PossessionEngine instance
 */
function createPossessionEngine(demons = [], auditLogger = null) {
  return new PossessionEngine(demons, auditLogger);
}

module.exports = {
  PossessionEngine,
  createPossessionEngine
};
