const express = require('express');
const TicketStore = require('./TicketStore');
const FileImporter = require('./FileImporter');
const Classifier = require('./Classifier');
const Ticket = require('./models/Ticket');
const AuditLog = require('./AuditLog');

const router = express.Router();
const store = new TicketStore();

// Helper function for response formatting
function sendError(res, status, message, details = []) {
  res.status(status).json({
    success: false,
    error: message,
    details
  });
}

// Create a new ticket
router.post('/tickets', (req, res) => {
  try {
    const ticketData = req.body;
    const ticket = store.create(ticketData);
    
    // Auto-run classification if requested
    let response = {
      success: true,
      ticket: ticket.toJSON()
    };

    if (req.query.auto_classify === 'true') {
      const classification = Classifier.classify(ticket);
      
      // Update ticket with classification
      ticket.category = classification.category;
      ticket.priority = classification.priority;
      ticket.classification_confidence = classification.confidence;
      ticket.classification_reasoning = classification.reasoning;
      ticket.updated_at = new Date().toISOString();

      // Log classification decision
      AuditLog.logClassification(ticket.id, classification, 'auto_classify_on_create', ticket);

      response.ticket = ticket.toJSON();
      response.classification = {
        category: classification.category,
        priority: classification.priority,
        confidence: classification.confidence,
        reasoning: classification.reasoning,
        keywords_found: classification.keywords_found
      };
    }

    res.status(201).json(response);
  } catch (error) {
    if (error.details) {
      sendError(res, 400, 'Validation failed', error.details);
    } else {
      sendError(res, 400, error.message);
    }
  }
});

// Get all tickets with filtering
router.get('/tickets', (req, res) => {
  try {
    const filters = {};

    if (req.query.category) filters.category = req.query.category;
    if (req.query.priority) filters.priority = req.query.priority;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.customer_id) filters.customer_id = req.query.customer_id;
    if (req.query.assigned_to) filters.assigned_to = req.query.assigned_to;

    const tickets = store.getAll(filters);
    res.json({
      success: true,
      count: tickets.length,
      tickets: tickets.map(t => t.toJSON())
    });
  } catch (error) {
    console.error('Error listing tickets:', error);
    sendError(res, 500, 'Internal server error');
  }
});

// Get ticket by ID
router.get('/tickets/:id', (req, res) => {
  try {
    const ticket = store.getById(req.params.id);
    if (!ticket) {
      return sendError(res, 404, 'Ticket not found');
    }
    res.json({
      success: true,
      ticket: ticket.toJSON()
    });
  } catch (error) {
    console.error('Error getting ticket:', error);
    sendError(res, 500, 'Internal server error');
  }
});

// Update ticket
router.put('/tickets/:id', (req, res) => {
  try {
    const ticket = store.update(req.params.id, req.body);
    if (!ticket) {
      return sendError(res, 404, 'Ticket not found');
    }
    res.json({
      success: true,
      ticket: ticket.toJSON()
    });
  } catch (error) {
    if (error.details) {
      sendError(res, 400, 'Validation failed', error.details);
    } else {
      sendError(res, 400, error.message);
    }
  }
});

// Delete ticket
router.delete('/tickets/:id', (req, res) => {
  try {
    const deleted = store.delete(req.params.id);
    if (!deleted) {
      return sendError(res, 404, 'Ticket not found');
    }
    res.json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    sendError(res, 500, 'Internal server error');
  }
});

// Bulk import tickets
router.post('/tickets/import', async (req, res) => {
  try {
    const { file_content, file_type } = req.body;

    if (!file_content) {
      return sendError(res, 400, 'file_content is required');
    }

    if (!file_type) {
      return sendError(res, 400, 'file_type is required (csv, json, or xml)');
    }

    const results = await FileImporter.import(file_content, file_type);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    // Add successful tickets to store using proper encapsulation
    successful.forEach(result => {
      store.add(result.ticket);
    });

    res.status(207).json({
      success: true,
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length
      },
      failed_records: failed.map((f, index) => ({
        record_number: index + 1,
        errors: f.errors
      })),
      imported_tickets: successful.map(s => s.ticket.toJSON())
    });
  } catch (error) {
    console.error('Import error:', error);
    if (error.status) {
      sendError(res, error.status, error.message, error.details);
    } else {
      sendError(res, 400, 'Import failed', [error.message]);
    }
  }
});

// Auto-classify ticket
router.post('/tickets/:id/auto-classify', (req, res) => {
  try {
    const ticket = store.getById(req.params.id);
    if (!ticket) {
      return sendError(res, 404, 'Ticket not found');
    }

    const classification = Classifier.classify(ticket);

    // Update ticket with classification
    ticket.category = classification.category;
    ticket.priority = classification.priority;
    ticket.classification_confidence = classification.confidence;
    ticket.classification_reasoning = classification.reasoning;
    ticket.updated_at = new Date().toISOString();

    // Log classification decision
    AuditLog.logClassification(ticket.id, classification, 'manual_classify', ticket);

    res.json({
      success: true,
      ticket: ticket.toJSON(),
      classification: {
        category: classification.category,
        priority: classification.priority,
        confidence: classification.confidence,
        reasoning: classification.reasoning,
        keywords_found: classification.keywords_found
      }
    });
  } catch (error) {
    console.error('Error auto-classifying ticket:', error);
    sendError(res, 500, 'Internal server error');
  }
});

// Get audit logs
router.get('/audit-logs', (req, res) => {
  try {
    const ticketId = req.query.ticket_id;
    const action = req.query.action;

    let logs;
    if (ticketId) {
      logs = AuditLog.getLogsForTicket(ticketId);
    } else if (action) {
      logs = AuditLog.getLogsByAction(action);
    } else {
      logs = AuditLog.getAllLogs();
    }

    res.json({
      success: true,
      count: logs.length,
      logs: logs
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    sendError(res, 500, 'Internal server error');
  }
});

// Get audit statistics
router.get('/audit-stats', (req, res) => {
  try {
    const stats = AuditLog.getStatistics();
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Error getting audit statistics:', error);
    sendError(res, 500, 'Internal server error');
  }
});

module.exports = router;
