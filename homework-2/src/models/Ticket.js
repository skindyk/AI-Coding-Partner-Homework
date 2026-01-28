const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const Sanitizer = require('../utils/sanitize');

const CATEGORIES = ['account_access', 'technical_issue', 'billing_question', 'feature_request', 'bug_report', 'other'];
const PRIORITIES = ['urgent', 'high', 'medium', 'low'];
const STATUSES = ['new', 'in_progress', 'waiting_customer', 'resolved', 'closed'];
const SOURCES = ['web_form', 'email', 'api', 'chat', 'phone'];
const DEVICE_TYPES = ['desktop', 'mobile', 'tablet'];

class Ticket {
  constructor(data) {
    // Sanitize string inputs to prevent XSS attacks
    this.id = data.id || uuidv4();
    this.customer_id = typeof data.customer_id === 'string' ? Sanitizer.escapeHtml(data.customer_id) : data.customer_id;
    this.customer_email = data.customer_email; // Email validation will catch malicious input
    this.customer_name = typeof data.customer_name === 'string' ? Sanitizer.escapeHtml(data.customer_name) : data.customer_name;
    this.subject = typeof data.subject === 'string' ? Sanitizer.escapeHtml(data.subject) : data.subject;
    this.description = typeof data.description === 'string' ? Sanitizer.escapeHtml(data.description) : data.description;
    this.category = data.category || 'other';
    this.priority = data.priority || 'medium';
    this.status = data.status || 'new';
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
    this.resolved_at = data.resolved_at || null;
    this.assigned_to = typeof data.assigned_to === 'string' ? Sanitizer.escapeHtml(data.assigned_to) : data.assigned_to;
    this.tags = Array.isArray(data.tags)
      ? data.tags.map(tag => typeof tag === 'string' ? Sanitizer.escapeHtml(tag) : tag)
      : [];
    this.metadata = data.metadata ? Sanitizer.sanitizeMetadata(data.metadata) : {
      source: 'api',
      browser: null,
      device_type: null
    };
    this.classification_confidence = data.classification_confidence || null;
    this.classification_reasoning = typeof data.classification_reasoning === 'string'
      ? Sanitizer.escapeHtml(data.classification_reasoning)
      : data.classification_reasoning;
  }

  validate() {
    const errors = [];

    // Required fields
    if (!this.customer_id || typeof this.customer_id !== 'string') {
      errors.push('customer_id is required and must be a string');
    }

    if (!this.customer_email || !validator.isEmail(this.customer_email)) {
      errors.push('customer_email is required and must be a valid email');
    }

    if (!this.customer_name || typeof this.customer_name !== 'string') {
      errors.push('customer_name is required and must be a string');
    }

    if (!this.subject || typeof this.subject !== 'string') {
      errors.push('subject is required and must be a string');
    } else if (this.subject.length < 1 || this.subject.length > 200) {
      errors.push('subject must be between 1 and 200 characters');
    }

    if (!this.description || typeof this.description !== 'string') {
      errors.push('description is required and must be a string');
    } else if (this.description.length < 10 || this.description.length > 2000) {
      errors.push('description must be between 10 and 2000 characters');
    }

    if (!CATEGORIES.includes(this.category)) {
      errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);
    }

    if (!PRIORITIES.includes(this.priority)) {
      errors.push(`priority must be one of: ${PRIORITIES.join(', ')}`);
    }

    if (!STATUSES.includes(this.status)) {
      errors.push(`status must be one of: ${STATUSES.join(', ')}`);
    }

    if (!Array.isArray(this.tags)) {
      errors.push('tags must be an array');
    }

    // Validate metadata if provided
    if (this.metadata) {
      if (this.metadata.source && !SOURCES.includes(this.metadata.source)) {
        errors.push(`metadata.source must be one of: ${SOURCES.join(', ')}`);
      }
      if (this.metadata.device_type && !DEVICE_TYPES.includes(this.metadata.device_type)) {
        errors.push(`metadata.device_type must be one of: ${DEVICE_TYPES.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      id: this.id,
      customer_id: this.customer_id,
      customer_email: this.customer_email,
      customer_name: this.customer_name,
      subject: this.subject,
      description: this.description,
      category: this.category,
      priority: this.priority,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at,
      resolved_at: this.resolved_at,
      assigned_to: this.assigned_to,
      tags: this.tags,
      metadata: this.metadata,
      classification_confidence: this.classification_confidence,
      classification_reasoning: this.classification_reasoning
    };
  }

  static getCategories() {
    return CATEGORIES;
  }

  static getPriorities() {
    return PRIORITIES;
  }

  static getStatuses() {
    return STATUSES;
  }

  static getSources() {
    return SOURCES;
  }

  static getDeviceTypes() {
    return DEVICE_TYPES;
  }
}

module.exports = Ticket;
