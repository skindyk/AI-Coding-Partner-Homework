const Ticket = require('./models/Ticket');

class TicketStore {
  constructor() {
    this.tickets = new Map();
  }

  create(ticketData) {
    const ticket = new Ticket(ticketData);
    const validation = ticket.validate();
    
    if (!validation.isValid) {
      const error = new Error('Validation failed');
      error.details = validation.errors;
      throw error;
    }

    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  getAll(filters = {}) {
    let results = Array.from(this.tickets.values());

    if (filters.category) {
      results = results.filter(t => t.category === filters.category);
    }

    if (filters.priority) {
      results = results.filter(t => t.priority === filters.priority);
    }

    if (filters.status) {
      results = results.filter(t => t.status === filters.status);
    }

    if (filters.customer_id) {
      results = results.filter(t => t.customer_id === filters.customer_id);
    }

    if (filters.assigned_to) {
      results = results.filter(t => t.assigned_to === filters.assigned_to);
    }

    return results;
  }

  getById(id) {
    return this.tickets.get(id);
  }

  update(id, updates) {
    const ticket = this.tickets.get(id);
    if (!ticket) {
      return null;
    }

    // Update allowed fields
    const allowedFields = [
      'subject', 'description', 'category', 'priority', 'status',
      'assigned_to', 'tags', 'resolved_at'
    ];

    allowedFields.forEach(field => {
      if (field in updates) {
        ticket[field] = updates[field];
      }
    });

    ticket.updated_at = new Date().toISOString();

    // If status is resolved or closed, set resolved_at
    if ((ticket.status === 'resolved' || ticket.status === 'closed') && !ticket.resolved_at) {
      ticket.resolved_at = ticket.updated_at;
    }

    const validation = ticket.validate();
    if (!validation.isValid) {
      const error = new Error('Validation failed');
      error.details = validation.errors;
      throw error;
    }

    return ticket;
  }

  delete(id) {
    return this.tickets.delete(id);
  }

  // Add ticket directly without validation (for pre-validated tickets from import)
  add(ticket) {
    if (!(ticket instanceof Ticket)) {
      throw new Error('Parameter must be a Ticket instance');
    }
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  clear() {
    this.tickets.clear();
  }

  size() {
    return this.tickets.size;
  }
}

module.exports = TicketStore;
