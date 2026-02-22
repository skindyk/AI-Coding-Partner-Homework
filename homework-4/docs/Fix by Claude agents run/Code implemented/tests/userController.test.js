/**
 * Unit Tests: GET /api/users/:id
 * Tests for getUserById following FIRST principles.
 *
 * FIRST compliance:
 *   Fast        - All tests use in-memory data; no network calls, no DB, no file I/O.
 *   Independent - No shared mutable state between tests; each request is stateless.
 *   Repeatable  - In-memory mock data is static; same result on every run in any env.
 *   Self-validating - Every test has explicit expect() assertions that pass or fail clearly.
 *   Timely      - Tests cover only getUserById (the changed code from fix API-404).
 */

// Bind to a random port to avoid conflicts when running tests alongside a live server.
process.env.PORT = 0;

const request = require('supertest');
const app = require('../server');

describe('GET /api/users/:id', () => {

  // -------------------------------------------------------------------------
  // Valid user IDs — happy path tests for all three seeded users
  // -------------------------------------------------------------------------
  describe('valid user IDs', () => {

    it('should return Alice Smith (200) for id 123', async () => {
      // Arrange
      const expectedUser = { id: 123, name: 'Alice Smith', email: 'alice@example.com' };

      // Act
      const response = await request(app).get('/api/users/123');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expectedUser);
    });

    it('should return Bob Johnson (200) for id 456', async () => {
      // Arrange
      const expectedUser = { id: 456, name: 'Bob Johnson', email: 'bob@example.com' };

      // Act
      const response = await request(app).get('/api/users/456');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expectedUser);
    });

    it('should return Charlie Brown (200) for id 789', async () => {
      // Arrange
      const expectedUser = { id: 789, name: 'Charlie Brown', email: 'charlie@example.com' };

      // Act
      const response = await request(app).get('/api/users/789');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expectedUser);
    });

  });

  // -------------------------------------------------------------------------
  // Invalid / non-existent user IDs — error handling paths
  // -------------------------------------------------------------------------
  describe('invalid user IDs', () => {

    it('should return 404 with error body for non-existent numeric id 999', async () => {
      // Arrange
      const expectedBody = { error: 'User not found' };

      // Act
      const response = await request(app).get('/api/users/999');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toEqual(expectedBody);
    });

    it('should return 404 for non-numeric id "abc" (parseInt returns NaN, no match found)', async () => {
      // Arrange — parseInt("abc", 10) === NaN; NaN !== any numeric id, so no user is found.

      // Act
      const response = await request(app).get('/api/users/abc');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });

  });

});
