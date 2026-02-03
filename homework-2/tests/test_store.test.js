const TicketStore = require('../src/TicketStore');
const Ticket = require('../src/models/Ticket');

describe('Ticket Store Operations', () => {
  let store;

  beforeEach(() => {
    store = new TicketStore();
  });

  const validTicketData = {
    customer_id: 'cust_001',
    customer_email: 'test@example.com',
    customer_name: 'Test User',
    subject: 'Test Subject',
    description: 'This is a test description for a valid ticket'
  };

  test('should create and store ticket', () => {
    const ticket = store.create(validTicketData);
    expect(ticket.id).toBeDefined();
    expect(store.size()).toBe(1);
  });

  test('should retrieve all tickets', () => {
    store.create(validTicketData);
    store.create({ ...validTicketData, customer_id: 'cust_002', customer_email: 'test2@example.com' });
    
    const tickets = store.getAll();
    expect(tickets.length).toBe(2);
  });

  test('should retrieve ticket by id', () => {
    const created = store.create(validTicketData);
    const retrieved = store.getById(created.id);
    
    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe(created.id);
  });

  test('should return null for non-existent ticket', () => {
    const ticket = store.getById('non_existent_id');
    expect(ticket).toBeUndefined();
  });

  test('should update ticket', (done) => {
    const created = store.create(validTicketData);
    const createdTime = created.updated_at;
    
    // Wait a bit to ensure timestamp changes
    setTimeout(() => {
      const updated = store.update(created.id, { status: 'in_progress' });
      
      expect(updated.status).toBe('in_progress');
      expect(updated.updated_at).not.toBe(createdTime);
      done();
    }, 10);
  });

  test('should delete ticket', () => {
    const created = store.create(validTicketData);
    const deleted = store.delete(created.id);
    
    expect(deleted).toBe(true);
    expect(store.size()).toBe(0);
  });

  test('should filter by category', () => {
    store.create({ ...validTicketData, category: 'technical_issue', priority: 'high' });
    store.create({ ...validTicketData, customer_id: 'cust_002', customer_email: 'test2@example.com', category: 'billing_question', priority: 'medium' });
    
    const filtered = store.getAll({ category: 'technical_issue' });
    expect(filtered.every(t => t.category === 'technical_issue')).toBe(true);
  });

  test('should filter by priority', () => {
    store.create({ ...validTicketData, priority: 'high' });
    store.create({ ...validTicketData, customer_id: 'cust_002', customer_email: 'test2@example.com', priority: 'low' });
    
    const filtered = store.getAll({ priority: 'high' });
    expect(filtered[0].priority).toBe('high');
  });

  test('should throw error on invalid ticket update', () => {
    const created = store.create(validTicketData);
    
    expect(() => {
      store.update(created.id, { subject: '' });
    }).toThrow();
  });

  test('should clear all tickets', () => {
    store.create(validTicketData);
    store.create({ ...validTicketData, customer_id: 'cust_002', customer_email: 'test2@example.com' });
    
    store.clear();
    expect(store.size()).toBe(0);
  });
});
