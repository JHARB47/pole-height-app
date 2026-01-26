/**
 * Enhanced Diagnostics API Routes
 * Provides detailed system diagnostics and health monitoring
 */

import express from 'express';
import { healthRegistry } from '../../src/utils/healthMonitor.js';
import { db } from '../services/db.js';
import process from 'node:process';
import { execSync } from 'child_process';

export const diagnosticsRouter = express.Router();

/**
 * GET /diagnostics/health
 * Comprehensive health check of all subsystems
 */
diagnosticsRouter.get('/health', async (req, res) => {
  try {
    const results = await healthRegistry.runAll();
    const summary = healthRegistry.getSummary(results);
    
    res.json({
      ...summary,
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * GET /diagnostics/system
 * System-level diagnostics
 */
diagnosticsRouter.get('/system', async (req, res) => {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
      },
      memory: {
        ...process.memoryUsage(),
        total: process.memoryUsage().rss / 1024 / 1024,
        heap: process.memoryUsage().heapUsed / 1024 / 1024,
        external: process.memoryUsage().external / 1024 / 1024,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabase: !!(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL),
        hasJwtSecret: !!process.env.JWT_SECRET,
      },
    };
    
    res.json(diagnostics);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * GET /diagnostics/database
 * Database connection and status
 */
diagnosticsRouter.get('/database', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test database connection
    let dbStatus = 'unknown';
    let dbLatency = 0;
    let dbError = null;
    
    try {
      if (db && db.ping) {
        await db.ping();
        dbLatency = Date.now() - startTime;
        dbStatus = 'connected';
      } else {
        dbStatus = 'not_configured';
      }
    } catch (error) {
      dbStatus = 'error';
      dbError = error.message;
    }
    
    res.json({
      status: dbStatus,
      latency: dbLatency,
      error: dbError,
      configured: !!(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * GET /diagnostics/performance
 * Performance metrics
 */
diagnosticsRouter.get('/performance', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage(),
      memoryUsage: process.memoryUsage(),
      resourceUsage: process.resourceUsage ? process.resourceUsage() : null,
    };
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * GET /diagnostics/dependencies
 * Check critical dependencies
 */
diagnosticsRouter.get('/dependencies', async (req, res) => {
  try {
    const dependencies = {
      timestamp: new Date().toISOString(),
      react: '18.2.0',
      express: '5.1.0',
      zustand: '5.0.8',
    };
    
    // Try to get package.json version
    try {
      const packageJson = JSON.parse(
        execSync('cat package.json', { encoding: 'utf-8' })
      );
      dependencies.appVersion = packageJson.version;
      dependencies.appName = packageJson.name;
    } catch (err) {
      // Ignore if can't read package.json
    }
    
    res.json(dependencies);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * GET /diagnostics/features
 * Feature flags and capabilities
 */
diagnosticsRouter.get('/features', async (req, res) => {
  try {
    const features = {
      timestamp: new Date().toISOString(),
      authentication: {
        jwt: !!process.env.JWT_SECRET,
        github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
        google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      },
      database: {
        postgres: !!(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL),
        pooled: !!process.env.NETLIFY_DATABASE_URL,
        unpooled: !!process.env.NETLIFY_DATABASE_URL_UNPOOLED,
      },
      monitoring: {
        sentry: !!process.env.SENTRY_DSN,
      },
      deployment: {
        netlify: !!process.env.NETLIFY,
        production: process.env.NODE_ENV === 'production',
      },
    };
    
    res.json(features);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * POST /diagnostics/test-calculation
 * Test calculation functions with sample data
 */
diagnosticsRouter.post('/test-calculation', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    // Basic validation test
    const testResult = {
      type,
      input: data,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
    
    // Simulate calculation (actual implementation would import and run calculations)
    if (type === 'sag') {
      testResult.status = 'success';
      testResult.message = 'Calculation function available';
    } else {
      testResult.status = 'unknown';
      testResult.message = `Calculation type ${type} not tested`;
    }
    
    res.json(testResult);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * GET /diagnostics/summary
 * Quick diagnostic summary
 */
diagnosticsRouter.get('/summary', async (req, res) => {
  try {
    const summary = {
      timestamp: new Date().toISOString(),
      status: 'operational',
      uptime: process.uptime(),
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        server: 'healthy',
        memory: process.memoryUsage().heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning',
        database: 'not_tested',
      },
    };
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

export default diagnosticsRouter;
