// @ts-nocheck
/**
 * PostgreSQL Database Service
 * Comprehensive database management with connection pooling,
 * migrations, and enterprise features
 */
import pg from "pg";
import { Logger } from "./logger.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Sentry } from "../instrument.js";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatabaseService {
  constructor() {
    this.pool = null;
    // AI: rationale — use manual span to avoid Sentry OTEL callback requirement in tests
    this.initSpan = Sentry.startSpanManual({
      op: "db.initialize",
      name: "DatabaseService.initialize",
    });
    this.initSpan.setAttribute(
      "environment",
      process.env.NODE_ENV || "development",
    );
    this.logger = new Logger();
    this.isInitialized = false;
  }

  /**
   * Initialize database connection pool
   */
  async initialize() {
    try {
      // Validate required environment variables
      if (!process.env.DATABASE_URL) {
        throw new Error(
          "DATABASE_URL environment variable is required. " +
            "Please check your .env file or environment configuration. " +
            "For local development: cp server/.env.example server/.env",
        );
      }

      const config = {
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
        max: 20, // Maximum pool size
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };

      this.pool = new Pool(config);

      // Test connection
      const client = await this.pool.connect();
      await client.query("SELECT NOW()");
      client.release();

      this.logger.info("Database pool initialized successfully");

      // Mark service as initialized BEFORE running migrations so internal
      // query()/transaction() calls inside runMigrations are allowed
      this.isInitialized = true;

      // Run migrations (uses this.query/transaction)
      await this.runMigrations();

      this.initSpan.setAttribute("poolMax", config.max);
      this.initSpan.setStatus({ code: "ok" });
    } catch (error) {
      this.logger.error("Database initialization failed:", error);
      this.initSpan.setStatus({ code: "error", message: error.message });
      Sentry.captureException(error);
      throw error;
    } finally {
      this.initSpan.end();
    }
  }

  /**
   * Execute database migrations
   */
  async runMigrations() {
    const migrationsPath = path.join(__dirname, "../migrations");

    try {
      // Create migrations table if it doesn't exist
      await this.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Get executed migrations
      const { rows: executedMigrations } = await this.query(
        "SELECT filename FROM migrations ORDER BY executed_at",
      );
      const executedSet = new Set(executedMigrations.map((m) => m.filename));

      // Read migration files
      const files = await fs.readdir(migrationsPath);
      const migrationFiles = files.filter((f) => f.endsWith(".sql")).sort();

      // Execute pending migrations
      for (const filename of migrationFiles) {
        if (!executedSet.has(filename)) {
          this.logger.info(`Running migration: ${filename}`);
          const migrationSQL = await fs.readFile(
            path.join(migrationsPath, filename),
            "utf8",
          );

          await this.transaction(async (client) => {
            await client.query(migrationSQL);
            await client.query(
              "INSERT INTO migrations (filename) VALUES ($1)",
              [filename],
            );
          });

          this.logger.info(`Migration completed: ${filename}`);
        }
      }
    } catch (error) {
      this.logger.error("Migration failed:", error);
      throw error;
    }
  }

  /**
   * Execute a query with optional parameters
   */
  async query(text, params = []) {
    if (!this.isInitialized) {
      throw new Error("Database not initialized");
    }

    const span = Sentry.startSpan({
      op: "db.query",
      name: text.substring(0, 64) || "db.query",
    });
    span.setAttribute("paramCount", params.length);
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      span.setAttribute("durationMs", duration);

      if (duration > 1000) {
        this.logger.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
      }

      span.setStatus({ code: "ok" });
      return result;
    } catch (error) {
      span.setStatus({ code: "error", message: error.message });
      this.logger.error("Database query error:", {
        query: text.substring(0, 100),
        params: params,
        error: error.message,
      });
      Sentry.captureException(error);
      throw error;
    } finally {
      if (span && typeof span.end === "function") span.end();
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction(callback) {
    if (!this.isInitialized) {
      throw new Error("Database not initialized");
    }

    const span = Sentry.startSpan({
      op: "db.transaction",
      name: "Database transaction",
    });
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      span.setStatus({ code: "ok" });
      return result;
    } catch (error) {
      span.setStatus({ code: "error", message: error.message });
      Sentry.captureException(error);
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
      if (span && typeof span.end === "function") span.end();
    }
  }

  /**
   * Get database health status
   */
  async getHealthStatus() {
    try {
      const result = await this.query("SELECT 1 as healthy");
      const poolStats = {
        totalClients: this.pool.totalCount,
        idleClients: this.pool.idleCount,
        waitingClients: this.pool.waitingCount,
      };

      return {
        status: "healthy",
        connected: true,
        pool: poolStats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Close database connection pool
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.logger.info("Database pool closed");
    }
  }

  // User management methods
  async createUser(userData) {
    const {
      email,
      password_hash,
      first_name,
      last_name,
      organization_id,
      role = "user",
    } = userData;

    const result = await this.query(
      `
      INSERT INTO users (email, password_hash, first_name, last_name, organization_id, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, first_name, last_name, role, created_at
    `,
      [email, password_hash, first_name, last_name, organization_id, role],
    );

    return result.rows[0];
  }

  async getUserById(id) {
    const result = await this.query(
      `
      SELECT u.*, o.name as organization_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = $1 AND u.deleted_at IS NULL
    `,
      [id],
    );

    return result.rows[0];
  }

  async getUserByEmail(email) {
    const result = await this.query(
      `
      SELECT u.*, o.name as organization_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.email = $1 AND u.deleted_at IS NULL
    `,
      [email],
    );

    return result.rows[0];
  }

  // Project management methods
  async createProject(projectData) {
    const {
      name,
      description,
      user_id,
      organization_id,
      project_data,
      location,
    } = projectData;

    const result = await this.query(
      `
      INSERT INTO projects (name, description, user_id, organization_id, project_data, location)
      VALUES ($1, $2, $3, $4, $5, ST_GeomFromGeoJSON($6))
      RETURNING id, name, description, created_at
    `,
      [
        name,
        description,
        user_id,
        organization_id,
        JSON.stringify(project_data),
        JSON.stringify(location),
      ],
    );

    return result.rows[0];
  }

  async getProjectsByUser(userId, organizationId = null) {
    let query = `
      SELECT p.*, u.first_name, u.last_name,
             ST_AsGeoJSON(p.location) as location_geojson
      FROM projects p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1 AND p.deleted_at IS NULL
    `;
    const params = [userId];

    if (organizationId) {
      query += " AND p.organization_id = $2";
      params.push(organizationId);
    }

    query += " ORDER BY p.updated_at DESC";

    const result = await this.query(query, params);
    return result.rows;
  }

  // API Key management
  async createApiKey(keyData) {
    const { user_id, name, key_hash, permissions, expires_at } = keyData;

    const result = await this.query(
      `
      INSERT INTO api_keys (user_id, name, key_hash, permissions, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, permissions, created_at
    `,
      [user_id, name, key_hash, JSON.stringify(permissions), expires_at],
    );

    return result.rows[0];
  }

  async validateApiKey(keyHash) {
    const result = await this.query(
      `
      SELECT ak.*, u.email, u.role, u.organization_id
      FROM api_keys ak
      JOIN users u ON ak.user_id = u.id
      WHERE ak.key_hash = $1 
        AND ak.is_active = true
        AND ak.deleted_at IS NULL
        AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
    `,
      [keyHash],
    );

    if (result.rows.length > 0) {
      // Update last used timestamp
      await this.query(
        "UPDATE api_keys SET last_used_at = NOW() WHERE id = $1",
        [result.rows[0].id],
      );
    }

    return result.rows[0];
  }

  // Audit logging
  async logAuditEvent(eventData) {
    const {
      user_id,
      action,
      resource_type,
      resource_id,
      details,
      ip_address,
      user_agent,
    } = eventData;

    await this.query(
      `
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      [
        user_id,
        action,
        resource_type,
        resource_id,
        JSON.stringify(details),
        ip_address,
        user_agent,
      ],
    );
  }
}
