// @ts-nocheck
/**
 * Authentication Middleware
 * JWT and API key authentication with session management
 */
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { db } from '../services/db.js';
import { Logger } from '../services/logger.js';
import { apiKeyMiddleware, flexibleAuthMiddleware } from './rbac.js';

const logger = new Logger();

/**
 * JWT Authentication Middleware
 */
export const authMiddleware = (req, res, next) => {
  // Check if API key authentication should be used
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (apiKey) {
    return apiKeyMiddleware(req, res, next);
  }
  
  // Use JWT authentication
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      logger.error('JWT authentication error:', err);
      return res.status(500).json({
        error: 'Authentication error',
        code: 'AUTH_ERROR'
      });
    }

    if (!user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        message: info?.message || 'Invalid or expired token'
      });
    }

    // Check if user is still active
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Account deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    req.user = user;
    req.authMethod = 'jwt';
    next();
  })(req, res, next);
};

/**
 * Optional Authentication Middleware
 * Allows both authenticated and unauthenticated requests
 */
export const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  // If no auth provided, continue without user
  if (!authHeader && !apiKey) {
    return next();
  }
  
  // Use regular auth middleware if credentials provided
  return authMiddleware(req, res, next);
};

/**
 * Admin Authentication Middleware
 * Requires admin or super_admin role
 */
export const adminAuthMiddleware = (req, res, next) => {
  authMiddleware(req, res, (err) => {
    if (err) return next(err);
    
    const user = req.user;
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return res.status(403).json({
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }
    
    next();
  });
};

/**
 * Session Management Middleware
 * Creates and manages user sessions
 */
export const sessionMiddleware = async (req, res, next) => {
  try {
    if (req.user && req.authMethod === 'jwt') {
      // Extract JWT payload for session info
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = jwt.decode(token);
        
        if (decoded && decoded.jti) {
          // Check if session exists and is valid
          const session = await db.query(
            'SELECT * FROM user_sessions WHERE token_hash = $1 AND expires_at > NOW()',
            [decoded.jti]
          );
          
          if (session.rows.length === 0) {
            return res.status(401).json({
              error: 'Session expired',
              code: 'SESSION_EXPIRED'
            });
          }
          
          req.session = session.rows[0];
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error('Session middleware error:', error);
    next();
  }
};

/**
 * Rate Limiting by User
 */
export const userRateLimitMiddleware = (maxRequests = 100, windowMs = 60000) => {
  const userRequests = new Map();
  
  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    if (userRequests.has(userId)) {
      const requests = userRequests.get(userId).filter(time => time > windowStart);
      userRequests.set(userId, requests);
    }
    
    const requests = userRequests.get(userId) || [];
    
    if (requests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retry_after: Math.ceil(windowMs / 1000)
      });
    }
    
    requests.push(now);
    userRequests.set(userId, requests);
    
    next();
  };
};