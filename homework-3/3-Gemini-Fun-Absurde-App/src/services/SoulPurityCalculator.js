'use strict';

const { SIN_CATEGORIES } = require('../models/Offering');
const { AUDIT_ACTIONS } = require('../models/AuditEvent');

/**
 * Soul Purity Calculator - Computes a "Soul Purity" score from financial history
 */
class SoulPurityCalculator {
  /**
   * Calculate soul purity percentage (0-100)
   * @param {array} offerings - All offerings
   * @param {array} auditEvents - All audit events
   * @param {number} currentTime - Optional current time in milliseconds (defaults to Date.now())
   * @returns {number} Purity score 0-100
   */
  static calculatePurity(offerings = [], auditEvents = [], currentTime = null) {
    let score = 100;

    // Deductions: −5 per unexorcised offering, −2 per exorcised offering
    for (const offering of offerings) {
      if (!offering.isExorcised) {
        score -= 5;
      } else {
        score -= 2;
      }
    }

    // Deductions: −10 for any offering over $100 (10000 cents)
    for (const offering of offerings) {
      if (offering.amount > 10000) {
        score -= 10;
      }
    }

    // Deductions: −15 for late-night transactions (23:00 to 04:00)
    for (const offering of offerings) {
      const hour = new Date(offering.timestamp).getHours();
      if (hour >= 23 || hour < 4) {
        score -= 15;
      }
    }

    // Bonuses: +3 per successfully completed ritual
    const completedRituals = auditEvents.filter(evt => evt.action === AUDIT_ACTIONS.RITUAL_COMPLETED).length;
    score += completedRituals * 3;

    // Bonuses: +5 if no possession in the last 7 days
    const now = currentTime !== null ? currentTime : Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const recentPossessions = auditEvents.filter(
      evt => evt.action === AUDIT_ACTIONS.POSSESSION_TRIGGERED && evt.timestamp >= sevenDaysAgo
    ).length;

    if (recentPossessions === 0 && offerings.length > 0) {
      score += 5;
    }

    // Floor at 0
    return Math.max(0, score);
  }

  /**
   * Get breakdown of spending by sin category (in cents)
   * @param {array} offerings - All offerings
   * @returns {object} Category totals
   */
  static getBreakdown(offerings = []) {
    const breakdown = {};

    // Initialize all categories
    Object.values(SIN_CATEGORIES).forEach(category => {
      breakdown[category] = 0;
    });

    // Sum by category
    for (const offering of offerings) {
      breakdown[offering.category] += offering.amount;
    }

    return breakdown;
  }

  /**
   * Calculate comprehensive purity report
   * @param {array} offerings - All offerings
   * @param {array} auditEvents - All audit events
   * @returns {object} Full report with score and breakdown
   */
  static getReport(offerings = [], auditEvents = []) {
    const soulPurity = this.calculatePurity(offerings, auditEvents);
    const breakdown = this.getBreakdown(offerings);
    const totalSpend = offerings.reduce((sum, o) => sum + o.amount, 0);
    const exorcisedCount = offerings.filter(o => o.isExorcised).length;
    const totalPossessions = auditEvents.filter(evt => evt.action === AUDIT_ACTIONS.POSSESSION_TRIGGERED).length;

    return {
      soulPurity,
      breakdown,
      totalOfferings: offerings.length,
      totalSpend,
      exorcisedCount,
      totalPossessions,
      exorcismSuccessRate: offerings.length > 0 ? (exorcisedCount / offerings.length) * 100 : 0
    };
  }
}

module.exports = SoulPurityCalculator;
