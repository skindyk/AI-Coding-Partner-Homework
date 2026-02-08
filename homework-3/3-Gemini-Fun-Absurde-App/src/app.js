'use strict';

const express = require('express');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');
const { setSecurityHeaders, createRateLimiter } = require('./middleware/security');
const { sanitiseBody } = require('./middleware/inputSanitiser');

const InMemoryStore = require('./store/InMemoryStore');
const demons = require('./models/demons.config');
const { createPossessionEngine } = require('./services/PossessionEngine');
const { createRitualService } = require('./services/RitualService');
const AuditLogger = require('./services/AuditLogger');

const transactionRoutes = require('./routes/transactions');
const auditRoutes = require('./routes/audit');
const dashboardRoutes = require('./routes/dashboard');
const complianceRoutes = require('./routes/compliance');

/**
 * Create and configure the Express application
 */
function createApp() {
  const app = express();

  // ===== Stores =====
  const offeringStore = new InMemoryStore('offerings');
  const auditStore = new InMemoryStore('auditEvents');
  const ritualSessionStore = new InMemoryStore('ritualSessions');

  // ===== Services =====
  const auditLogger = new AuditLogger(auditStore);
  const possessionEngine = createPossessionEngine(demons, auditLogger);
  const ritualService = createRitualService(auditLogger);

  // ===== Middleware =====
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(setSecurityHeaders);
  app.use(createRateLimiter(30, 60000)); // 30 requests/minute
  app.use(sanitiseBody);

  // ===== Static Files =====
  app.use(express.static(path.join(__dirname, '../public')));

  // ===== Routes =====
  app.use('/api/v1/transactions', transactionRoutes({
    offeringStore,
    auditStore,
    auditLogger,
    possessionEngine,
    ritualService
  }));

  app.use('/api/v1/audit', auditRoutes({
    auditLogger
  }));

  app.use('/api/v1/dashboard', dashboardRoutes({
    offeringStore,
    auditStore
  }));

  app.use('/api/v1/compliance', complianceRoutes({
    offeringStore,
    auditStore,
    auditLogger
  }));

  // ===== Health Check =====
  app.get('/api/v1/health', (req, res) => {
    res.json({ success: true, status: 'healthy' });
  });

  // ===== 404 Handler =====
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found'
      }
    });
  });

  // ===== Error Handler =====
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
