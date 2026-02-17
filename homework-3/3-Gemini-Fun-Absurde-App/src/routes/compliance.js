'use strict';

const express = require('express');
const { AUDIT_ACTIONS } = require('../models/AuditEvent');

/**
 * Create compliance routes
 */
function createComplianceRoutes({ offeringStore, auditStore, auditLogger }) {
  const router = express.Router();

  /**
   * GET /api/v1/compliance/export
   * Export all user data as JSON (GDPR Art. 20)
   */
  router.get('/export', (req, res, next) => {
    try {
      const offerings = offeringStore.getAll();
      const auditEvents = auditLogger.exportAll();

      // Log the export
      auditLogger.log(
        AUDIT_ACTIONS.DATA_EXPORTED,
        'System',
        'export',
        null,
        { offeringCount: offerings.length, auditEventCount: auditEvents.length }
      );

      res.set({
        'Content-Disposition': 'attachment; filename="financial-exorcist-export.json"',
        'Content-Type': 'application/json'
      });

      res.json({
        success: true,
        data: {
          offerings,
          auditEvents,
          exportedAt: new Date().toISOString()
        }
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * DELETE /api/v1/compliance/purge
   * Irreversibly delete all user data (GDPR Art. 17)
   * Requires confirmation header: x-confirm-purge: yes
   */
  router.delete('/purge', (req, res, next) => {
    try {
      const confirmation = req.get('x-confirm-purge');

      if (confirmation !== 'yes') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PURGE_CONFIRMATION_REQUIRED',
            message: 'Purge requires confirmation header: x-confirm-purge: yes'
          }
        });
      }

      // Get counts before purging
      const offeringCount = offeringStore.count();
      const auditEventCount = auditStore.count();

      // Log purge BEFORE clearing
      auditLogger.log(
        AUDIT_ACTIONS.DATA_PURGED,
        'System',
        'purge',
        { offeringCount, auditEventCount },
        null
      );

      // Clear all stores
      offeringStore.clear();
      auditStore.clear();

      res.json({
        success: true,
        message: 'All data purged',
        data: {
          offeringsPurged: offeringCount,
          auditEventsPurged: auditEventCount + 1 // +1 for the purge event itself
        }
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = createComplianceRoutes;
