const Classifier = require('../src/Classifier');

describe('Ticket Classification', () => {
  test('should classify account access issue', () => {
    const ticket = {
      subject: 'Cannot access my account',
      description: 'I cannot login and the password reset is not working. I am locked out of my account.'
    };

    const result = Classifier.classify(ticket);
    expect(result.category).toBe('account_access');
  });

  test('should classify technical issue', () => {
    const ticket = {
      subject: 'App crashes on startup',
      description: 'The application throws an exception and crashes every time I try to start it'
    };

    const result = Classifier.classify(ticket);
    expect(result.category).toBe('technical_issue');
  });

  test('should classify billing question', () => {
    const ticket = {
      subject: 'Charged twice for subscription',
      description: 'I received an invoice for a duplicate payment. Please refund the extra charge.'
    };

    const result = Classifier.classify(ticket);
    expect(result.category).toBe('billing_question');
  });

  test('should classify feature request', () => {
    const ticket = {
      subject: 'Request for dark mode feature',
      description: 'Would be nice to have a dark mode option in the application for night time use'
    };

    const result = Classifier.classify(ticket);
    expect(result.category).toBe('feature_request');
  });

  test('should classify bug report', () => {
    const ticket = {
      subject: 'Bug: Export fails with large files',
      description: 'Steps to reproduce: Open file > Click export > Wait for processing. The export fails every time.'
    };

    const result = Classifier.classify(ticket);
    expect(result.category).toBe('bug_report');
  });

  test('should classify as urgent priority', () => {
    const ticket = {
      subject: 'Critical: Production down',
      description: 'Production system is down. Cannot access critical application. This is urgent!'
    };

    const result = Classifier.classify(ticket);
    expect(result.priority).toBe('urgent');
  });

  test('should classify as high priority', () => {
    const ticket = {
      subject: 'Important: Blocking issue',
      description: 'This is blocking our team from completing the project. Needs important attention.'
    };

    const result = Classifier.classify(ticket);
    expect(result.priority).toBe('high');
  });

  test('should classify as low priority', () => {
    const ticket = {
      subject: 'Minor cosmetic issue',
      description: 'This is a trivial issue. Just a minor UI improvement.'
    };

    const result = Classifier.classify(ticket);
    expect(result.priority).toBe('low');
  });

  test('should return confidence score', () => {
    const ticket = {
      subject: 'Cannot login',
      description: 'I am locked out of my account. I cannot access my account anymore.'
    };

    const result = Classifier.classify(ticket);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  test('should return keywords found', () => {
    const ticket = {
      subject: 'Password reset not working',
      description: 'The password reset feature is not working. I cannot access my account.'
    };

    const result = Classifier.classify(ticket);
    expect(Array.isArray(result.keywords_found)).toBe(true);
    expect(result.keywords_found.length).toBeGreaterThan(0);
  });
});
