// @ts-nocheck
/**
 * PolePlan Pro Enterprise Server
 * Main Express.js server with comprehensive enterprise features
 */
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
import { adminRouter } from './routes/admin.js';
import { geospatialRouter } from './routes/geospatial.js';
import { projectsRouter } from './routes/projects.js';

// Import middleware
import { authMiddleware } from './middleware/auth.js';
import { rbacMiddleware } from './middleware/rbac.js';
import { auditMiddleware } from './middleware/audit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

// Import services
import { DatabaseService } from './services/database.js';
import { Logger } from './services/logger.js';
import { MetricsService } from './services/metrics.js';
import { PassportConfig } from './config/passport.js';

// Load environment variables
dotenv.config();

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

// Health check route (must be before auth)
app.use('/health', healthRouter);
app.use('/api/health', healthRouter);

// Authentication routes
app.use('/auth', authRouter);

// API routes with middleware
app.use('/api/v1', 
  authMiddleware,
  auditMiddleware,
  apiRouter
);

// Admin routes with RBAC
app.use('/api/admin',
  authMiddleware,
  rbacMiddleware(['admin', 'super_admin']),
  auditMiddleware,
  adminRouter
);

// Geospatial data routes
app.use('/api/geospatial',
  authMiddleware,
  rbacMiddleware(['user', 'engineer', 'admin']),
  auditMiddleware, 
  geospatialRouter
);

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
app.use(errorHandler);

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await db.close();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await db.initialize();
    logger.info('Database connection established');
    
    // Start metrics collection
    metrics.start();
    
    app.listen(PORT, () => {
      logger.info(`PolePlan Pro Enterprise Server running on port ${PORT}`);
      logger.info(`Environment: ${NODE_ENV}`);
      logger.info(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;