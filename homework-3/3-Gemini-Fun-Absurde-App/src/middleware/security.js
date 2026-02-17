'use strict';

/**
 * Set security headers (CSP, X-Frame-Options, etc.)
 */
function setSecurityHeaders(req, res, next) {
  res.set({
    'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  });

  next();
}

/**
 * Rate limiter - simple in-memory per-session counter
 * Limits mutating operations (POST/PUT/DELETE) to maxRequests per windowMs
 */
function createRateLimiter(maxRequests = 30, windowMs = 60000) {
  const sessions = new Map();

  return (req, res, next) => {
    // Only rate-limit mutating operations
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
      return next();
    }

    const sessionId = req.get('x-session-id') || req.ip;
    const now = Date.now();

    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, []);
    }

    const requests = sessions.get(sessionId);

    // Remove old requests outside the window
    const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Max ${maxRequests} requests per ${windowMs}ms`
        }
      });
    }

    recentRequests.push(now);
    sessions.set(sessionId, recentRequests);

    // Clean up old sessions
    if (sessions.size > 10000) {
      const oldestSession = Array.from(sessions.entries())
        .sort((a, b) => Math.min(...a[1]) - Math.min(...b[1]))
        .shift();
      if (oldestSession) {
        sessions.delete(oldestSession[0]);
      }
    }

    next();
  };
}

module.exports = {
  setSecurityHeaders,
  createRateLimiter
};
