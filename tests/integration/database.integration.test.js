// @ts-nocheck
/**
 * Database Test Setup with PostgreSQL Testcontainers
 * Enterprise-grade testing with isolated database instances
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { GenericContainer, Wait } from 'testcontainers';
import { DatabaseService } from '../server/services/database.js';
import { Logger } from '../server/services/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatabaseTestHelper {
  constructor() {
    this.container = null;
    this.db = null;
    this.logger = new Logger();
    this.testDbUrl = null;
  }

  /**
   * Start PostgreSQL test container
   */
  async setupTestDatabase() {
    try {
      this.logger.info('Starting PostgreSQL test container...');
      
      // Start PostgreSQL container with PostGIS
      this.container = await new GenericContainer('postgis/postgis:16-3.4')
        .withEnvironment({
          POSTGRES_DB: 'poleplan_test',
          POSTGRES_USER: 'test_user',
          POSTGRES_PASSWORD: 'test_password',
          POSTGRES_INITDB_ARGS: '--auth-host=scram-sha-256'
        })
        .withExposedPorts(5432)
        .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections'))
        .withStartupTimeout(60000)
        .start();

      const port = this.container.getMappedPort(5432);
      const host = this.container.getHost();
      
      this.testDbUrl = `postgresql://test_user:test_password@${host}:${port}/poleplan_test`;
      
      // Set environment variable for database service
      // eslint-disable-next-line no-undef
      process.env.DATABASE_URL = this.testDbUrl;
      
      // Initialize database service
      this.db = new DatabaseService();
      await this.db.initialize();
      
      this.logger.info(`Test database ready at ${this.testDbUrl}`);
      return this.db;
    } catch (error) {
      this.logger.error('Failed to setup test database:', error);
      throw error;
    }
  }

  /**
   * Cleanup test database
   */
  async teardownTestDatabase() {
    try {
      if (this.db) {
        await this.db.close();
      }
      
      if (this.container) {
        await this.container.stop();
        this.logger.info('Test database container stopped');
      }
    } catch (error) {
      this.logger.error('Failed to teardown test database:', error);
    }
  }

  /**
   * Clean all test data between tests
   */
  async cleanDatabase() {
    if (!this.db) return;

    try {
      // Delete all data in reverse dependency order
      await this.db.query('TRUNCATE audit_logs CASCADE');
      await this.db.query('TRUNCATE api_keys CASCADE');
      await this.db.query('TRUNCATE user_sessions CASCADE');
      await this.db.query('TRUNCATE geospatial_cache CASCADE');
      await this.db.query('TRUNCATE projects CASCADE');
      await this.db.query('TRUNCATE users CASCADE');
      await this.db.query('TRUNCATE organizations CASCADE');
      await this.db.query('TRUNCATE system_metrics CASCADE');
      
      this.logger.debug('Test database cleaned');
    } catch (error) {
      this.logger.error('Failed to clean test database:', error);
      throw error;
    }
  }

  /**
   * Create test user
   */
  async createTestUser(userData = {}) {
    const defaultUser = {
      email: 'test@example.com',
      password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz7q8kQ6y8NnY4KxW7R8Y4rJ3J5Y7Yq', // 'password'
      first_name: 'Test',
      last_name: 'User',
      role: 'user',
      is_active: true,
      email_verified: true
    };

    const user = await this.db.createUser({ ...defaultUser, ...userData });
    return user;
  }

  /**
   * Create test organization
   */
  async createTestOrganization(orgData = {}) {
    const defaultOrg = {
      name: 'Test Organization',
      domain: 'test.com',
      subscription_tier: 'basic',
      max_users: 10
    };

    const result = await this.db.query(`
      INSERT INTO organizations (name, domain, subscription_tier, max_users)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      orgData.name || defaultOrg.name,
      orgData.domain || defaultOrg.domain,
      orgData.subscription_tier || defaultOrg.subscription_tier,
      orgData.max_users || defaultOrg.max_users
    ]);

    return result.rows[0];
  }

  /**
   * Create test project
   */
  async createTestProject(projectData = {}, userId = null) {
    if (!userId) {
      const user = await this.createTestUser();
      userId = user.id;
    }

    const defaultProject = {
      name: 'Test Project',
      description: 'A test project for testing',
      project_data: {
        spans: [],
        poles: [],
        calculations: {}
      },
      location: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749] // San Francisco
      }
    };

    const project = await this.db.createProject({
      ...defaultProject,
      ...projectData,
      user_id: userId
    });

    return project;
  }

  /**
   * Seed test data
   */
  async seedTestData() {
    try {
      // Create test organization
      const org = await this.createTestOrganization();

      // Create test users with different roles
      const admin = await this.createTestUser({
        email: 'admin@test.com',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        organization_id: org.id
      });

      const engineer = await this.createTestUser({
        email: 'engineer@test.com',
        first_name: 'Engineer',
        last_name: 'User',
        role: 'engineer',
        organization_id: org.id
      });

      const user = await this.createTestUser({
        email: 'user@test.com',
        first_name: 'Regular',
        last_name: 'User',
        role: 'user',
        organization_id: org.id
      });

      // Create test projects
      const adminProject = await this.createTestProject({
        name: 'Admin Project',
        description: 'Project created by admin'
      }, admin.id);

      const engineerProject = await this.createTestProject({
        name: 'Engineer Project',
        description: 'Project created by engineer'
      }, engineer.id);

      const userProject = await this.createTestProject({
        name: 'User Project',
        description: 'Project created by user'
      }, user.id);

      return {
        organization: org,
        users: { admin, engineer, user },
        projects: { adminProject, engineerProject, userProject }
      };
    } catch (error) {
      this.logger.error('Failed to seed test data:', error);
      throw error;
    }
  }

  /**
   * Get database statistics for debugging
   */
  async getDatabaseStats() {
    if (!this.db) return null;

    try {
      const stats = await this.db.query(`
        SELECT 
          schemaname,
          tablename,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
      `);

      return stats.rows;
    } catch (error) {
      this.logger.error('Failed to get database stats:', error);
      return null;
    }
  }
}

// Global test helper instance
export const dbTestHelper = new DatabaseTestHelper();

/**
 * Test suite setup helpers
 */
export function setupDatabaseTests() {
  beforeAll(async () => {
    await dbTestHelper.setupTestDatabase();
  }, 60000); // 60 second timeout for container start

  afterAll(async () => {
    await dbTestHelper.teardownTestDatabase();
  });

  beforeEach(async () => {
    await dbTestHelper.cleanDatabase();
  });
}

/**
 * Database integration test suite
 */
describe('Database Integration Tests', () => {
  setupDatabaseTests();

  test('should connect to test database', async () => {
    const health = await dbTestHelper.db.getHealthStatus();
    expect(health.status).toBe('healthy');
    expect(health.connected).toBe(true);
  });

  test('should create and retrieve user', async () => {
    const userData = {
      email: 'integration@test.com',
      password_hash: 'hashed_password',
      first_name: 'Integration',
      last_name: 'Test',
      role: 'user'
    };

    const createdUser = await dbTestHelper.db.createUser(userData);
    expect(createdUser).toBeDefined();
    expect(createdUser.email).toBe(userData.email);
    expect(createdUser.id).toBeDefined();

    const retrievedUser = await dbTestHelper.db.getUserById(createdUser.id);
    expect(retrievedUser).toBeDefined();
    expect(retrievedUser.email).toBe(userData.email);
  });

  test('should create project with geospatial data', async () => {
    const user = await dbTestHelper.createTestUser();
    
    const projectData = {
      name: 'Geospatial Test Project',
      description: 'Testing geospatial features',
      user_id: user.id,
      project_data: {
        spans: [
          { id: 1, length: 100, height: 30 }
        ]
      },
      location: {
        type: 'Point',
        coordinates: [-74.006, 40.7128] // New York
      }
    };

    const project = await dbTestHelper.db.createProject(projectData);
    expect(project).toBeDefined();
    expect(project.name).toBe(projectData.name);
    expect(project.id).toBeDefined();

    // Verify geospatial data was stored correctly
    const result = await dbTestHelper.db.query(`
      SELECT ST_AsGeoJSON(location) as location_geojson
      FROM projects 
      WHERE id = $1
    `, [project.id]);
    
    expect(result.rows.length).toBe(1);
    const locationData = JSON.parse(result.rows[0].location_geojson);
    expect(locationData.type).toBe('Point');
    expect(locationData.coordinates).toEqual([-74.006, 40.7128]);
  });

  test('should handle API key operations', async () => {
    const user = await dbTestHelper.createTestUser();
    
    const keyData = {
      user_id: user.id,
      name: 'Test API Key',
      key_hash: 'hashed_key_value',
      permissions: ['projects:read', 'projects:write'],
      expires_at: new Date(Date.now() + 86400000) // 24 hours from now
    };

    const apiKey = await dbTestHelper.db.createApiKey(keyData);
    expect(apiKey).toBeDefined();
    expect(apiKey.name).toBe(keyData.name);
    expect(apiKey.permissions).toEqual(keyData.permissions);

    // Test API key validation
    const validatedKey = await dbTestHelper.db.validateApiKey(keyData.key_hash);
    expect(validatedKey).toBeDefined();
    expect(validatedKey.user_id).toBe(user.id);
    expect(validatedKey.email).toBe(user.email);
  });

  test('should log audit events', async () => {
    const user = await dbTestHelper.createTestUser();
    
    const auditData = {
      user_id: user.id,
      action: 'test_action',
      resource_type: 'test_resource',
      resource_id: 'test_id',
      details: { test: 'data' },
      ip_address: '127.0.0.1',
      user_agent: 'Test Agent'
    };

    await dbTestHelper.db.logAuditEvent(auditData);

    // Verify audit log was created
    const result = await dbTestHelper.db.query(`
      SELECT * FROM audit_logs 
      WHERE user_id = $1 AND action = $2
    `, [user.id, auditData.action]);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].action).toBe(auditData.action);
    expect(result.rows[0].resource_type).toBe(auditData.resource_type);
  });

  test('should handle database transactions', async () => {
    const user = await dbTestHelper.createTestUser();
    
    // Test successful transaction
    await dbTestHelper.db.transaction(async (client) => {
      await client.query(
        'INSERT INTO projects (name, description, user_id) VALUES ($1, $2, $3)',
        ['Transaction Test 1', 'First project', user.id]
      );
      
      await client.query(
        'INSERT INTO projects (name, description, user_id) VALUES ($1, $2, $3)',
        ['Transaction Test 2', 'Second project', user.id]
      );
    });

    // Verify both projects were created
    const projects = await dbTestHelper.db.getProjectsByUser(user.id);
    expect(projects.length).toBe(2);

    // Test failed transaction (should rollback)
    await expect(dbTestHelper.db.transaction(async (client) => {
      await client.query(
        'INSERT INTO projects (name, description, user_id) VALUES ($1, $2, $3)',
        ['Transaction Test 3', 'Third project', user.id]
      );
      
      // This should fail due to invalid user_id
      await client.query(
        'INSERT INTO projects (name, description, user_id) VALUES ($1, $2, $3)',
        ['Transaction Test 4', 'Fourth project', 'invalid-uuid']
      );
    })).rejects.toThrow();

    // Verify rollback worked - should still only have 2 projects
    const projectsAfterRollback = await dbTestHelper.db.getProjectsByUser(user.id);
    expect(projectsAfterRollback.length).toBe(2);
  });
});