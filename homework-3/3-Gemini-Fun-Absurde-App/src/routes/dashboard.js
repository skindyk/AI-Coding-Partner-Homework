'use strict';

const express = require('express');
const SoulPurityCalculator = require('../services/SoulPurityCalculator');

/**
 * Create dashboard routes
 */
function createDashboardRoutes({ offeringStore, auditStore }) {
  const router = express.Router();

  /**
   * GET /api/v1/dashboard
   * Get soul purity score and breakdown
   */
  router.get('/', (req, res, next) => {
    try {
      const offerings = offeringStore.getAll();
      const auditEvents = auditStore.getAll();

      const report = SoulPurityCalculator.getReport(offerings, auditEvents);

      res.json({
        success: true,
        data: report
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = createDashboardRoutes;
