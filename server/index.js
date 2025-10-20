// @ts-nocheck
/**
 * PolePlan Pro Enterprise Server
 * Main Express.js server with comprehensive enterprise features
 */
import * as Sentry from "@sentry/node";
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import passport from 'passport';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import enterprise modules
import { authRouter } from './routes/auth.js';
import { apiRouter } from './routes/api.js';
import { healthRouter } from './routes/health.js';
// import { adminRouter } from './routes/admin.js'; // TODO: Create admin routes
// import { geospatialRouter } from './routes/geospatial.js'; // TODO: Create geospatial routes
import { projectsRouter } from './routes/projects.js';

// Import middleware
import { authMiddleware } from './middleware/auth.js';
import { rbacMiddleware } from './middleware/rbac.js';
import { auditMiddleware } from './middleware/audit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger, setRequestLoggerMetrics } from './middleware/requestLogger.js';

// Import services
import { DatabaseService } from './services/database.js';
import { Logger } from './services/logger.js';
import { MetricsService } from './services/metrics.js';
import { PassportConfig } from './config/passport.js';
import { Sentry } from './instrument.js';

// Load environment variables
dotenv.config();

// Initialize Sentry for server-side error tracking
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  integrations: [
    // HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  // Release tracking
  release: process.env.npm_package_version || '1.0.0',
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize services
const logger = new Logger();
const db = new DatabaseService();
const metrics = new MetricsService();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "*.tile.openstreetmap.org"],
      scriptSrc: ["'self'", "'unsafe-inline'", "unpkg.com"],
      connectSrc: ["'self'", "api.github.com"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// CORS configuration
app.use(cors({
  origin: NODE_ENV === 'production' 
    ? ['https://poleplanpro.com', 'https://www.poleplanpro.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Passport initialization
PassportConfig.initialize();
app.use(passport.initialize());

// Sentry request handler (must be before all routes)
app.use(Sentry.Handlers.requestHandler());

// Sentry request/trace instrumentation (must come before routes)
app.use(Sentry.Handlers.requestHandler());
if (typeof Sentry.Handlers.tracingHandler === 'function') {
  app.use(Sentry.Handlers.tracingHandler());
}

// Health check route (must be before auth)
app.use('/health', healthRouter);
app.use('/api/health', healthRouter);

// Authentication routes
app.use('/auth', authRouter);

// Sentry verification helper
app.get('/debug-sentry', (req, res) => {
  const { logger } = Sentry;
  if (logger && typeof logger.info === 'function') {
    logger.info('User triggered test error', {
      action: 'test_error_endpoint',
      ip: req.ip,
    });
  }

  Sentry.startSpan({
    op: 'debug.trigger',
    name: 'manual debug-sentry invocation',
  }, (span) => {
    span.setAttribute('path', req.path);
    span.setAttribute('method', req.method);
    throw new Error('My first Sentry error!');
  });
});

// API routes with middleware
app.use('/api/v1', 
  authMiddleware,
  auditMiddleware,
  apiRouter
);

// Admin routes with RBAC (TODO: Implement admin routes)
// app.use('/api/admin',
//   authMiddleware,
//   rbacMiddleware(['admin', 'super_admin']),
//   auditMiddleware,
//   adminRouter
// );

// Geospatial data routes (TODO: Implement geospatial routes)
// app.use('/api/geospatial',
//   authMiddleware,
//   rbacMiddleware(['user', 'engineer', 'admin']),
//   auditMiddleware, 
//   geospatialRouter
// );

// Project management routes
app.use('/api/projects',
  authMiddleware,
  rbacMiddleware(['user', 'engineer', 'admin']),
  auditMiddleware,
  projectsRouter
);

// Serve static files in production
if (NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../dist');
  app.use(express.static(staticPath));
  
  // Handle React routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Error handling
app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);

// Sentry error handler (must be after all routes)
app.use(Sentry.Handlers.errorHandler());

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  try { metrics.stop(); } catch { /* ignore */ }
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  try { metrics.stop(); } catch { /* ignore */ }
  await db.close();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
  // Initialize database
  await db.initialize();
  app.locals.db = db;
  app.locals.metrics = metrics;
  logger.info('Database connection established');
    
    // Initialize database with Sentry instrumentation
    await Sentry.startSpan({
      op: 'db.init',
      name: 'Database initialization',
    }, async (span) => {
      await db.initialize();
      span.setAttribute('poolMax', db.pool?.options?.max ?? 20);
      span.setAttribute('environment', NODE_ENV);
      logger.info('Database connection established');
    });

    // Start metrics collection
    metrics.start();
  // Provide shared metrics instance to request logger middleware
  try { setRequestLoggerMetrics(metrics); } catch { /* ignore */ }
    
    await Sentry.startSpan({
      op: 'metrics.start',
      name: 'Metrics service start',
    }, async () => {
      metrics.start();
    });

    app.listen(PORT, () => {
      logger.info(`PolePlan Pro Enterprise Server running on port ${PORT}`);
      logger.info(`Environment: ${NODE_ENV}`);
      logger.info(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    Sentry.captureException(error);
    process.exit(1);
  }
}

startServer();

export default app;