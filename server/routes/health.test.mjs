import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../services/logger.js', () => ({
  Logger: class {
    info = vi.fn();
    warn = vi.fn();
    error = vi.fn();
  }
}));

vi.mock('../services/metrics.js', () => ({
  MetricsService: class {
    getErrorRate = vi.fn().mockResolvedValue(0);
    getAllMetrics = vi.fn().mockResolvedValue({});
  }
}));

vi.mock('../services/database.js', () => {
  const state = {
    isInitialized: false,
    query: vi.fn().mockResolvedValue({ rows: [] }),
    getHealthStatus: vi.fn().mockResolvedValue({ status: 'healthy' }),
  };

  class MockDatabaseService {
    constructor() {
      this.isInitialized = state.isInitialized;
      this.query = state.query;
      this.getHealthStatus = state.getHealthStatus;
    }
  }

  return {
    DatabaseService: MockDatabaseService,
    __setMockDbState: (overrides = {}) => {
      if (overrides.isInitialized !== undefined) state.isInitialized = overrides.isInitialized;
      if (overrides.query) state.query = overrides.query;
      if (overrides.getHealthStatus) state.getHealthStatus = overrides.getHealthStatus;
    },
    __getMockDbState: () => state,
  };
});

describe('health router', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  async function createApp(configureState) {
    const { __setMockDbState } = await import('../services/database.js');
    __setMockDbState({
      isInitialized: false,
      query: vi.fn().mockResolvedValue({ rows: [] }),
      getHealthStatus: vi.fn().mockResolvedValue({ status: 'healthy' }),
    });

    if (configureState) {
      configureState(__setMockDbState);
    }

    const { healthRouter } = await import('./health.js');
    const app = express();
    app.use('/', healthRouter);
    return app;
  }

  it('reports healthy status with database not initialized', async () => {
    const app = await createApp((setState) => {
      setState({ isInitialized: false });
    });

    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body.database).toEqual({ status: 'not_initialized' });
    expect(res.body.status).toBe('healthy');
  });

  it('returns degraded status when database ping fails', async () => {
    const app = await createApp((setState) => {
      setState({
        isInitialized: true,
        query: vi.fn().mockRejectedValue(new Error('db offline')),
      });
    });

    const res = await request(app).get('/');

    expect(res.status).toBe(503);
    expect(res.body.database).toMatchObject({ status: 'error' });
    expect(res.body.status).toBe('degraded');
  });
});
