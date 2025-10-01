// @ts-nocheck
import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock database pool
const mockQuery = vi.fn();
const mockPool = {
  query: mockQuery,
  connect: vi.fn(() => Promise.resolve()),
  end: vi.fn(() => Promise.resolve())
};

// Simple database service for testing
class TestDatabaseService {
  constructor() {
    this.pool = mockPool;
  }

  async query(text, params) {
    return this.pool.query(text, params);
  }

  async getHealthStatus() {
    try {
      await this.query('SELECT 1');
      return { status: 'healthy', connected: true };
    } catch (error) {
      return { status: 'unhealthy', connected: false, error: error.message };
    }
  }

  async createUser(userData) {
    const { email, password_hash, first_name, last_name, role } = userData;
    const result = await this.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [email, password_hash, first_name, last_name, role]);
    
    return result.rows[0];
  }

  async getUserById(id) {
    const result = await this.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  async getUserByEmail(email) {
    const result = await this.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }
}

describe('Database Service', () => {
  let dbService;

  beforeEach(() => {
    dbService = new TestDatabaseService();
    mockQuery.mockClear();
  });

  test('should return healthy status when database is accessible', async () => {
    mockQuery.mockResolvedValue({ rows: [{ '?column?': 1 }] });

    const health = await dbService.getHealthStatus();

    expect(health.status).toBe('healthy');
    expect(health.connected).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith('SELECT 1', undefined);
  });

  test('should return unhealthy status when database is not accessible', async () => {
    mockQuery.mockRejectedValue(new Error('Connection failed'));

    const health = await dbService.getHealthStatus();

    expect(health.status).toBe('unhealthy');
    expect(health.connected).toBe(false);
    expect(health.error).toBe('Connection failed');
  });

  test('should create user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      password_hash: 'hashed_password',
      first_name: 'Test',
      last_name: 'User',
      role: 'user'
    };

    const mockUser = { id: 1, ...userData };
    mockQuery.mockResolvedValue({ rows: [mockUser] });

    const result = await dbService.createUser(userData);

    expect(result).toEqual(mockUser);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO users'),
      [userData.email, userData.password_hash, userData.first_name, userData.last_name, userData.role]
    );
  });

  test('should get user by ID', async () => {
    const mockUser = { id: 1, email: 'test@example.com', role: 'user' };
    mockQuery.mockResolvedValue({ rows: [mockUser] });

    const result = await dbService.getUserById(1);

    expect(result).toEqual(mockUser);
    expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
  });

  test('should get user by email', async () => {
    const mockUser = { id: 1, email: 'test@example.com', role: 'user' };
    mockQuery.mockResolvedValue({ rows: [mockUser] });

    const result = await dbService.getUserByEmail('test@example.com');

    expect(result).toEqual(mockUser);
    expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', ['test@example.com']);
  });

  test('should return undefined when user not found', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const result = await dbService.getUserById(999);

    expect(result).toBeUndefined();
  });
});