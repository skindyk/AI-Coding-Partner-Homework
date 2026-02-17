'use strict';

const express = require('express');

/**
 * Create audit routes
 */
function createAuditRoutes({ auditLogger }) {
  const router = express.Router();

  /**
   * GET /api/v1/audit
   * Get audit events with optional filters
   * Query params:
   *   - action: Filter by action type
   *   - entityType: Filter by entity type
   *   - from: Filter by start timestamp (ms)
   *   - to: Filter by end timestamp (ms)
   *   - unmask: If true (with x-role: ops header), show unmasked amounts
   */
  router.get('/', (req, res, next) => {
    try {
      const { action, entityType, from, to, unmask } = req.query;

      // Check if unmask is requested and validate ops role
      const shouldUnmask = unmask === 'true' && req.get('x-role') === 'ops';

      const filters = {
        action,
        entityType,
        from: from ? parseInt(from, 10) : undefined,
        to: to ? parseInt(to, 10) : undefined,
        unmask: shouldUnmask
      };

      const events = auditLogger.getEvents(filters);

      res.json({
        success: true,
        data: {
          events,
          count: events.length,
          filters
        }
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/audit/:entityId
   * Get audit events for a specific entity
   */
  router.get('/:entityId', (req, res, next) => {
    try {
      const { unmask } = req.query;
      const shouldUnmask = unmask === 'true' && req.get('x-role') === 'ops';

      const events = auditLogger.getEventsByEntity(req.params.entityId, shouldUnmask);

      res.json({
        success: true,
        data: {
          entityId: req.params.entityId,
          events,
          count: events.length
        }
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = createAuditRoutes;
