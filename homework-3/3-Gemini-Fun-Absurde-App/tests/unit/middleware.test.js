'use strict';

const errorHandler = require('../../src/middleware/errorHandler');
const { sanitiseBody } = require('../../src/middleware/inputSanitiser');
const { setSecurityHeaders, createRateLimiter } = require('../../src/middleware/security');

describe('Middleware', () => {
  describe('errorHandler', () => {
    let req, res, next;

    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('should handle generic errors', () => {
      const err = new Error('Test error');
      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(false);
      expect(response.error.message).toBe('Test error');
    });

    it('should handle ValidationError', () => {
      const err = new Error('Invalid input');
      err.name = 'ValidationError';
      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const response = res.json.mock.calls[0][0];
      expect(response.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle NotFoundError', () => {
      const err = new Error('Not found');
      err.name = 'NotFoundError';
      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle ConflictError', () => {
      const err = new Error('Conflict');
      err.name = 'ConflictError';
      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should handle custom status codes', () => {
      const err = new Error('Forbidden');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('setSecurityHeaders', () => {
    let req, res, next;

    beforeEach(() => {
      req = {};
      res = {
        set: jest.fn()
      };
      next = jest.fn();
    });

    it('should set security headers', () => {
      setSecurityHeaders(req, res, next);

      expect(res.set).toHaveBeenCalled();
      const headers = res.set.mock.calls[0][0];
      expect(headers['Content-Security-Policy']).toBeDefined();
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
    });

    it('should call next middleware', () => {
      setSecurityHeaders(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('createRateLimiter', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        method: 'GET',
        ip: '127.0.0.1',
        get: jest.fn()
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('should not rate limit GET requests', () => {
      const limiter = createRateLimiter(30, 60000);
      req.method = 'GET';
      limiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should allow mutations within limit', () => {
      const limiter = createRateLimiter(2, 60000);
      req.method = 'POST';
      req.get.mockReturnValue(undefined);

      limiter(req, res, next);
      expect(next).toHaveBeenCalled();

      limiter(req, res, next);
      expect(next).toHaveBeenCalledTimes(2);
    });

    it('should reject mutations exceeding limit', () => {
      const limiter = createRateLimiter(1, 60000);
      req.method = 'POST';
      req.get.mockReturnValue(undefined);

      limiter(req, res, next);
      expect(next).toHaveBeenCalled();

      // Reset mocks
      next.mockClear();
      res.status.mockClear();
      res.json.mockClear();

      // Second request should be rejected
      limiter(req, res, next);
      expect(res.status).toHaveBeenCalledWith(429);
      expect(next).not.toHaveBeenCalled();
    });

    it('should use session ID if provided', () => {
      const limiter = createRateLimiter(1, 60000);
      req.method = 'POST';
      req.get.mockReturnValue('session-123');

      limiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('sanitiseBody', () => {
    let req, res, next;

    beforeEach(() => {
      res = {};
      next = jest.fn();
    });

    it('should sanitise request body', () => {
      req = {
        body: {
          description: '<script>alert("xss")</script>'
        }
      };

      sanitiseBody(req, res, next);
      expect(req.body.description).not.toContain('<script>');
      expect(req.body.description).toContain('&lt;');
      expect(next).toHaveBeenCalled();
    });

    it('should handle missing body', () => {
      req = {};
      expect(() => {
        sanitiseBody(req, res, next);
      }).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    it('should handle nested objects', () => {
      req = {
        body: {
          user: {
            name: '<script>evil</script>'
          }
        }
      };

      sanitiseBody(req, res, next);
      expect(req.body.user.name).toContain('&lt;');
      expect(next).toHaveBeenCalled();
    });

    it('should handle arrays', () => {
      req = {
        body: {
          tags: ['<script>a</script>', 'normal']
        }
      };

      sanitiseBody(req, res, next);
      expect(req.body.tags[0]).toContain('&lt;');
      expect(req.body.tags[1]).toBe('normal');
      expect(next).toHaveBeenCalled();
    });
  });
});
