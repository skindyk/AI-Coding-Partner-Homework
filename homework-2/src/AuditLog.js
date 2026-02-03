/**
 * AuditLog.js - Classification Decision Audit Trail
 * 
 * Maintains a log of all auto-classification decisions for compliance and debugging
 */

class AuditLog {
  constructor() {
    this.logs = [];
    this.logFile = [];
  }

  /**
   * Log a classification decision
   * @param {string} ticketId - ID of classified ticket
   * @param {object} classification - Classification result
   * @param {string} action - Action taken (e.g., 'auto_classify_on_create', 'manual_classify')
   * @param {object} ticket - Original ticket object
   */
  logClassification(ticketId, classification, action = 'manual_classify', ticket = {}) {
    const timestamp = new Date().toISOString();
    
    const logEntry = {
      timestamp,
      ticketId,
      action,
      classification: {
        category: classification.category,
        priority: classification.priority,
        confidence: classification.confidence,
        reasoning: classification.reasoning,
        keywords_found: classification.keywords_found
      },
      ticket_subject: ticket.subject || 'N/A',
      ticket_description_preview: ticket.description ? ticket.description.substring(0, 100) : 'N/A'
    };

    this.logs.push(logEntry);
    this.logFile.push(logEntry);
    
    return logEntry;
  }

  /**
   * Get all logs
   * @returns {array} Array of log entries
   */
  getAllLogs() {
    return this.logs;
  }

  /**
   * Get logs for a specific ticket
   * @param {string} ticketId - Ticket ID to filter
   * @returns {array} Log entries for ticket
   */
  getLogsForTicket(ticketId) {
    return this.logs.filter(log => log.ticketId === ticketId);
  }

  /**
   * Get logs by action type
   * @param {string} action - Action type to filter
   * @returns {array} Log entries matching action
   */
  getLogsByAction(action) {
    return this.logs.filter(log => log.action === action);
  }

  /**
   * Get logs since timestamp
   * @param {string} sinceTimestamp - ISO8601 timestamp
   * @returns {array} Log entries after timestamp
   */
  getLogsSince(sinceTimestamp) {
    return this.logs.filter(log => new Date(log.timestamp) > new Date(sinceTimestamp));
  }

  /**
   * Clear all logs (for testing)
   */
  clear() {
    this.logs = [];
    this.logFile = [];
  }

  /**
   * Get statistics about classifications
   * @returns {object} Statistics object
   */
  getStatistics() {
    const stats = {
      total_logs: this.logs.length,
      by_action: {},
      by_category: {},
      by_priority: {},
      average_confidence: 0
    };

    let totalConfidence = 0;
    let confidenceCount = 0;

    this.logs.forEach(log => {
      // Count by action
      stats.by_action[log.action] = (stats.by_action[log.action] || 0) + 1;

      // Count by category
      stats.by_category[log.classification.category] = 
        (stats.by_category[log.classification.category] || 0) + 1;

      // Count by priority
      stats.by_priority[log.classification.priority] = 
        (stats.by_priority[log.classification.priority] || 0) + 1;

      // Sum confidence for average
      totalConfidence += log.classification.confidence;
      confidenceCount++;
    });

    if (confidenceCount > 0) {
      stats.average_confidence = (totalConfidence / confidenceCount).toFixed(2);
    }

    return stats;
  }
}

// Create singleton instance
const auditLog = new AuditLog();

module.exports = auditLog;
