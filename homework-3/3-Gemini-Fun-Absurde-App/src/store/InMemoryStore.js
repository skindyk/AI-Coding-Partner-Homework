'use strict';

class StoreError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StoreError';
  }
}

/**
 * Generic in-memory data store backed by a JavaScript Map
 */
class InMemoryStore {
  constructor(name = 'Store') {
    this.name = name;
    this.data = new Map();
  }

  /**
   * Get all entities
   * @returns {array} Shallow copy of all entities
   */
  getAll() {
    return Array.from(this.data.values());
  }

  /**
   * Get entity by ID
   * @param {string} id - Entity ID
   * @returns {object|undefined} Entity or undefined if not found
   */
  getById(id) {
    return this.data.get(id);
  }

  /**
   * Create a new entity
   * @param {object} entity - Entity with id property
   * @returns {object} The stored entity
   * @throws {StoreError} If entity lacks id
   */
  create(entity) {
    if (!entity || typeof entity !== 'object') {
      throw new StoreError('Entity must be an object');
    }
    if (!entity.id) {
      throw new StoreError('Entity must have an id property');
    }
    if (this.data.has(entity.id)) {
      throw new StoreError(`Entity with id "${entity.id}" already exists`);
    }

    this.data.set(entity.id, entity);
    return entity;
  }

  /**
   * Update an existing entity
   * @param {string} id - Entity ID
   * @param {object} patch - Partial update
   * @returns {object} The updated entity
   * @throws {StoreError} If entity not found
   */
  update(id, patch) {
    if (!this.data.has(id)) {
      throw new StoreError(`Entity with id "${id}" not found`);
    }

    const existing = this.data.get(id);
    const updated = Object.freeze({ ...existing, ...patch });
    this.data.set(id, updated);
    return updated;
  }

  /**
   * Delete an entity
   * @param {string} id - Entity ID
   * @returns {object} The deleted entity
   * @throws {StoreError} If entity not found
   */
  delete(id) {
    if (!this.data.has(id)) {
      throw new StoreError(`Entity with id "${id}" not found`);
    }

    const entity = this.data.get(id);
    this.data.delete(id);
    return entity;
  }

  /**
   * Clear all entities
   */
  clear() {
    this.data.clear();
  }

  /**
   * Get count of entities
   * @returns {number} Number of entities
   */
  count() {
    return this.data.size;
  }

  /**
   * Check if entity exists
   * @param {string} id - Entity ID
   * @returns {boolean} True if entity exists
   */
  exists(id) {
    return this.data.has(id);
  }
}

module.exports = InMemoryStore;
