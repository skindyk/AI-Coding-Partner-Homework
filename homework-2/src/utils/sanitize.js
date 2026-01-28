/**
 * Simple input sanitization utility to prevent XSS attacks
 * Escapes HTML special characters in strings
 */

class Sanitizer {
  /**
   * Escape HTML special characters to prevent XSS
   * @param {string} str - String to sanitize
   * @returns {string} - Sanitized string
   */
  static escapeHtml(str) {
    if (typeof str !== 'string') {
      return str;
    }

    const htmlEscapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };

    return str.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
  }

  /**
   * Sanitize an object by escaping all string values
   * @param {Object} obj - Object to sanitize
   * @param {Array} excludeFields - Fields to exclude from sanitization
   * @returns {Object} - Sanitized object
   */
  static sanitizeObject(obj, excludeFields = []) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
      if (excludeFields.includes(key)) {
        sanitized[key] = value;
      } else if (typeof value === 'string') {
        sanitized[key] = this.escapeHtml(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item =>
          typeof item === 'string' ? this.escapeHtml(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value, excludeFields);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitize metadata fields that may contain user-generated content
   * @param {Object} metadata - Metadata object
   * @returns {Object} - Sanitized metadata
   */
  static sanitizeMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object') {
      return metadata;
    }

    return {
      source: metadata.source, // Validated by enum, no need to sanitize
      browser: typeof metadata.browser === 'string' ? this.escapeHtml(metadata.browser) : metadata.browser,
      device_type: metadata.device_type, // Validated by enum, no need to sanitize
      // Sanitize any additional metadata fields
      ...Object.keys(metadata)
        .filter(key => !['source', 'browser', 'device_type'].includes(key))
        .reduce((acc, key) => {
          acc[key] = typeof metadata[key] === 'string'
            ? this.escapeHtml(metadata[key])
            : metadata[key];
          return acc;
        }, {})
    };
  }
}

module.exports = Sanitizer;
