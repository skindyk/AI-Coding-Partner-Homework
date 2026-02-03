const Sanitizer = require('../src/utils/sanitize');

describe('Sanitizer', () => {
  describe('escapeHtml', () => {
    test('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const output = Sanitizer.escapeHtml(input);
      expect(output).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });

    test('should escape ampersand', () => {
      expect(Sanitizer.escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    test('should escape single quotes', () => {
      expect(Sanitizer.escapeHtml("It's working")).toBe("It&#x27;s working");
    });

    test('should return non-string values unchanged', () => {
      expect(Sanitizer.escapeHtml(123)).toBe(123);
      expect(Sanitizer.escapeHtml(null)).toBe(null);
      expect(Sanitizer.escapeHtml(undefined)).toBe(undefined);
    });

    test('should handle empty string', () => {
      expect(Sanitizer.escapeHtml('')).toBe('');
    });

    test('should handle string without special characters', () => {
      expect(Sanitizer.escapeHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('sanitizeObject', () => {
    test('should sanitize all string values in object', () => {
      const input = {
        name: '<script>alert("XSS")</script>',
        description: 'Safe text'
      };
      const output = Sanitizer.sanitizeObject(input);
      expect(output.name).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
      expect(output.description).toBe('Safe text');
    });

    test('should sanitize nested objects', () => {
      const input = {
        user: {
          name: '<img src=x onerror=alert(1)>',
          age: 30
        }
      };
      const output = Sanitizer.sanitizeObject(input);
      expect(output.user.name).toBe('&lt;img src=x onerror=alert(1)&gt;');
      expect(output.user.age).toBe(30);
    });

    test('should sanitize arrays of strings', () => {
      const input = {
        tags: ['<script>', 'safe', '<img>']
      };
      const output = Sanitizer.sanitizeObject(input);
      expect(output.tags).toEqual(['&lt;script&gt;', 'safe', '&lt;img&gt;']);
    });

    test('should exclude specified fields from sanitization', () => {
      const input = {
        html: '<div>Keep this</div>',
        text: '<div>Escape this</div>'
      };
      const output = Sanitizer.sanitizeObject(input, ['html']);
      expect(output.html).toBe('<div>Keep this</div>');
      expect(output.text).toBe('&lt;div&gt;Escape this&lt;&#x2F;div&gt;');
    });

    test('should handle null and non-object values', () => {
      expect(Sanitizer.sanitizeObject(null)).toBe(null);
      expect(Sanitizer.sanitizeObject('string')).toBe('string');
      expect(Sanitizer.sanitizeObject(123)).toBe(123);
    });

    test('should handle empty object', () => {
      expect(Sanitizer.sanitizeObject({})).toEqual({});
    });

    test('should preserve non-string values', () => {
      const input = {
        count: 42,
        active: true,
        date: null,
        value: undefined
      };
      const output = Sanitizer.sanitizeObject(input);
      expect(output.count).toBe(42);
      expect(output.active).toBe(true);
      expect(output.date).toBe(null);
      expect(output.value).toBe(undefined);
    });
  });

  describe('sanitizeMetadata', () => {
    test('should sanitize browser field while preserving enum fields', () => {
      const input = {
        source: 'web_form',
        browser: '<script>alert("XSS")</script>',
        device_type: 'desktop'
      };
      const output = Sanitizer.sanitizeMetadata(input);
      expect(output.source).toBe('web_form');
      expect(output.browser).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
      expect(output.device_type).toBe('desktop');
    });

    test('should handle null browser', () => {
      const input = {
        source: 'api',
        browser: null,
        device_type: 'mobile'
      };
      const output = Sanitizer.sanitizeMetadata(input);
      expect(output.browser).toBe(null);
    });

    test('should sanitize additional custom metadata fields', () => {
      const input = {
        source: 'email',
        browser: 'Firefox',
        device_type: 'desktop',
        custom_field: '<img src=x>'
      };
      const output = Sanitizer.sanitizeMetadata(input);
      expect(output.custom_field).toBe('&lt;img src=x&gt;');
    });

    test('should handle null or non-object metadata', () => {
      expect(Sanitizer.sanitizeMetadata(null)).toBe(null);
      expect(Sanitizer.sanitizeMetadata(undefined)).toBe(undefined);
      expect(Sanitizer.sanitizeMetadata('string')).toBe('string');
    });

    test('should handle empty metadata object', () => {
      const output = Sanitizer.sanitizeMetadata({});
      expect(output).toEqual({});
    });
  });
});
