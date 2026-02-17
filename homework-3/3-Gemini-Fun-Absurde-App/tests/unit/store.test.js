'use strict';

const InMemoryStore = require('../../src/store/InMemoryStore');

describe('InMemoryStore', () => {
  let store;

  beforeEach(() => {
    store = new InMemoryStore('test');
  });

  describe('create', () => {
    it('should create an entity', () => {
      const entity = { id: '1', name: 'Test' };
      const result = store.create(entity);
      expect(result).toEqual(entity);
      expect(store.count()).toBe(1);
    });

    it('should throw if entity lacks id', () => {
      expect(() => {
        store.create({ name: 'Test' });
      }).toThrow('must have an id');
    });

    it('should throw if entity already exists', () => {
      store.create({ id: '1', name: 'Test' });
      expect(() => {
        store.create({ id: '1', name: 'Duplicate' });
      }).toThrow('already exists');
    });
  });

  describe('getById', () => {
    it('should retrieve an entity by id', () => {
      const entity = { id: '1', name: 'Test' };
      store.create(entity);
      const result = store.getById('1');
      expect(result).toEqual(entity);
    });

    it('should return undefined if entity not found', () => {
      const result = store.getById('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all entities', () => {
      store.create({ id: '1', name: 'A' });
      store.create({ id: '2', name: 'B' });
      const all = store.getAll();
      expect(all.length).toBe(2);
      expect(all[0].id).toBe('1');
      expect(all[1].id).toBe('2');
    });

    it('should return empty array when store is empty', () => {
      const all = store.getAll();
      expect(all).toEqual([]);
    });

    it('should return a shallow copy, not a reference', () => {
      store.create({ id: '1', name: 'Test' });
      const all1 = store.getAll();
      const all2 = store.getAll();
      expect(all1).not.toBe(all2);
    });
  });

  describe('update', () => {
    it('should update an entity', () => {
      store.create({ id: '1', name: 'Test', value: 10 });
      const updated = store.update('1', { value: 20 });
      expect(updated.value).toBe(20);
      expect(updated.name).toBe('Test'); // original field preserved
    });

    it('should throw if entity not found', () => {
      expect(() => {
        store.update('nonexistent', { name: 'Test' });
      }).toThrow('not found');
    });
  });

  describe('delete', () => {
    it('should delete an entity', () => {
      store.create({ id: '1', name: 'Test' });
      const deleted = store.delete('1');
      expect(deleted.id).toBe('1');
      expect(store.count()).toBe(0);
    });

    it('should throw if entity not found', () => {
      expect(() => {
        store.delete('nonexistent');
      }).toThrow('not found');
    });
  });

  describe('clear', () => {
    it('should clear all entities', () => {
      store.create({ id: '1' });
      store.create({ id: '2' });
      store.clear();
      expect(store.count()).toBe(0);
      expect(store.getAll()).toEqual([]);
    });
  });

  describe('count', () => {
    it('should return correct count', () => {
      expect(store.count()).toBe(0);
      store.create({ id: '1' });
      expect(store.count()).toBe(1);
      store.create({ id: '2' });
      expect(store.count()).toBe(2);
    });
  });

  describe('exists', () => {
    it('should return true if entity exists', () => {
      store.create({ id: '1' });
      expect(store.exists('1')).toBe(true);
    });

    it('should return false if entity does not exist', () => {
      expect(store.exists('nonexistent')).toBe(false);
    });
  });
});
