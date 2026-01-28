const Ticket = require('../src/models/Ticket');

describe('Ticket Model Validation', () => {
  // Valid ticket data
  const validTicketData = {
    customer_id: 'cust_123',
    customer_email: 'john@example.com',
    customer_name: 'John Doe',
    subject: 'Cannot login to my account',
    description: 'I have been unable to access my account for the past 2 days. The password reset is not working either.',
    category: 'account_access',
    priority: 'high',
    status: 'new',
    tags: ['login', 'urgent'],
    metadata: {
      source: 'web_form',
      browser: 'Chrome',
      device_type: 'desktop'
    }
  };

  test('should create a valid ticket', () => {
    const ticket = new Ticket(validTicketData);
    expect(ticket.customer_id).toBe('cust_123');
    expect(ticket.customer_email).toBe('john@example.com');
    expect(ticket.id).toBeDefined();
  });

  test('should fail validation with missing customer_id', () => {
    const data = { ...validTicketData };
    delete data.customer_id;
    const ticket = new Ticket(data);
    const validation = ticket.validate();
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('customer_id is required and must be a string');
  });

  test('should fail validation with invalid email', () => {
    const data = { ...validTicketData, customer_email: 'invalid-email' };
    const ticket = new Ticket(data);
    const validation = ticket.validate();
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('customer_email is required and must be a valid email');
  });

  test('should fail validation with short subject', () => {
    const data = { ...validTicketData, subject: '' };
    const ticket = new Ticket(data);
    const validation = ticket.validate();
    expect(validation.isValid).toBe(false);
  });

  test('should fail validation with long subject (>200 chars)', () => {
    const data = { ...validTicketData, subject: 'a'.repeat(201) };
    const ticket = new Ticket(data);
    const validation = ticket.validate();
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some(e => e.includes('subject must be between'))).toBe(true);
  });

  test('should fail validation with short description (<10 chars)', () => {
    const data = { ...validTicketData, description: 'short' };
    const ticket = new Ticket(data);
    const validation = ticket.validate();
    expect(validation.isValid).toBe(false);
  });

  test('should fail validation with long description (>2000 chars)', () => {
    const data = { ...validTicketData, description: 'a'.repeat(2001) };
    const ticket = new Ticket(data);
    const validation = ticket.validate();
    expect(validation.isValid).toBe(false);
  });

  test('should fail validation with invalid category', () => {
    const data = { ...validTicketData, category: 'invalid_category' };
    const ticket = new Ticket(data);
    const validation = ticket.validate();
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some(e => e.includes('category must be one of'))).toBe(true);
  });

  test('should fail validation with invalid priority', () => {
    const data = { ...validTicketData, priority: 'super_urgent' };
    const ticket = new Ticket(data);
    const validation = ticket.validate();
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some(e => e.includes('priority must be one of'))).toBe(true);
  });
});
