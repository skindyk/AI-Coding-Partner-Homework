'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const OfferingModel = require('../models/Offering');
const { AUDIT_ACTIONS } = require('../models/AuditEvent');
const { SIN_CATEGORIES } = OfferingModel;

/**
 * Create transaction routes
 * @param {object} deps - Dependencies
 */
function createTransactionRoutes({
  offeringStore,
  auditStore,
  auditLogger,
  possessionEngine,
  ritualService
}) {
  const router = express.Router();

  /**
   * GET /api/v1/transactions
   * List all offerings
   */
  router.get('/', (req, res, next) => {
    try {
      const offerings = offeringStore.getAll();
      res.json({
        success: true,
        data: offerings
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/transactions/:id
   * Get offering by ID
   */
  router.get('/:id', (req, res, next) => {
    try {
      const offering = offeringStore.getById(req.params.id);

      if (!offering) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Offering not found' }
        });
      }

      res.json({
        success: true,
        data: offering
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/v1/transactions
   * Create a new offering
   */
  router.post('/', (req, res, next) => {
    try {
      const { amount, description, category, timestamp } = req.body;

      // Validate input
      if (typeof amount !== 'number' || !Number.isInteger(amount)) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Amount must be an integer' }
        });
      }

      if (!description || typeof description !== 'string') {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Description is required' }
        });
      }

      if (!category || typeof category !== 'string') {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Category is required' }
        });
      }

      // Create offering
      const offering = OfferingModel.create({
        amount,
        description,
        category,
        timestamp: timestamp || Date.now(),
        isExorcised: false
      });

      // Store offering
      offeringStore.create(offering);

      // Log creation
      auditLogger.log(
        AUDIT_ACTIONS.OFFERING_CREATED,
        'Offering',
        offering.id,
        null,
        offering
      );

      // Check for possession
      const history = offeringStore.getAll().filter(o => o.id !== offering.id);
      const possession = possessionEngine.checkPossession(offering, history);

      res.status(201).json({
        success: true,
        data: {
          offering,
          possession: possession || null
        }
      });
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: err.message }
        });
      }
      next(err);
    }
  });

  /**
   * PUT /api/v1/transactions/:id
   * Update offering (only description and category are mutable)
   */
  router.put('/:id', (req, res, next) => {
    try {
      const offering = offeringStore.getById(req.params.id);

      if (!offering) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Offering not found' }
        });
      }

      const { description, category, isExorcised } = req.body;
      const updates = {};

      // Only these fields are mutable
      if (description !== undefined) {
        if (typeof description !== 'string' || description.trim().length === 0) {
          return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Description must be a non-empty string' }
          });
        }
        updates.description = description;
      }

      if (category !== undefined) {
        if (typeof category !== 'string') {
          return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Category must be a string' }
          });
        }
        const validCategories = Object.values(SIN_CATEGORIES);
        if (!validCategories.includes(category)) {
          return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: `Category must be one of: ${validCategories.join(', ')}` }
          });
        }
        updates.category = category;
      }

      if (isExorcised !== undefined) {
        if (typeof isExorcised !== 'boolean') {
          return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'isExorcised must be a boolean' }
          });
        }
        updates.isExorcised = isExorcised;

        // If exorcised, clear possession
        if (isExorcised && possessionEngine.isCurrentlyPossessed()) {
          possessionEngine.clearPossession(req.params.id);
        }
      }

      // Check for attempts to modify immutable fields
      if (req.body.amount !== undefined || req.body.timestamp !== undefined) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Amount and timestamp are immutable' }
        });
      }

      // Update offering
      const updated = offeringStore.update(req.params.id, updates);

      // Log update
      auditLogger.log(
        AUDIT_ACTIONS.OFFERING_UPDATED,
        'Offering',
        req.params.id,
        offering,
        updated
      );

      res.json({
        success: true,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * DELETE /api/v1/transactions/:id
   * Delete offering
   */
  router.delete('/:id', (req, res, next) => {
    try {
      const offering = offeringStore.getById(req.params.id);

      if (!offering) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Offering not found' }
        });
      }

      // Delete offering
      offeringStore.delete(req.params.id);

      // Log deletion
      auditLogger.log(
        AUDIT_ACTIONS.OFFERING_DELETED,
        'Offering',
        req.params.id,
        offering,
        null
      );

      res.json({
        success: true,
        message: 'Offering deleted'
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/v1/transactions/debug/reset-possession
   * Reset possession state (for testing/debugging)
   */
  router.post('/debug/reset-possession', (req, res, next) => {
    try {
      possessionEngine.reset();
      res.json({
        success: true,
        message: 'Possession state reset'
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = createTransactionRoutes;
