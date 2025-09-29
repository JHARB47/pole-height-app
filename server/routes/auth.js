// @ts-nocheck
/**
 * Authentication Routes
 * Handles login, logout, SSO callbacks, and token management
 */
import express from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { PassportConfig } from '../config/passport.js';
import { DatabaseService } from '../services/database.js';
import { Logger } from '../services/logger.js';

const router = express.Router();
const db = new DatabaseService();
const logger = new Logger();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Local authentication
router.post('/login', authLimiter, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      logger.error('Login error:', err);
      return res.status(500).json({
        error: 'Authentication failed',
        code: 'AUTH_ERROR'
      });
    }

    if (!user) {
      return res.status(401).json({
        error: info.message || 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate tokens
    const accessToken = PassportConfig.generateToken(user);
    const refreshToken = PassportConfig.generateRefreshToken();

    // Remove sensitive data
    const safeUser = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      organization_id: user.organization_id,
      organization_name: user.organization_name
    };

    res.json({
      success: true,
      user: safeUser,
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: 86400 // 24 hours
      }
    });
  })(req, res, next);
});

// User registration
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, first_name, last_name, organization_code } = req.body;

    // Validation
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'MISSING_FIELDS'
      });
    }

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        code: 'USER_EXISTS'
      });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Handle organization
    let organization_id = null;
    if (organization_code) {
      const org = await db.query(
        'SELECT id FROM organizations WHERE domain = $1',
        [organization_code]
      );
      if (org.rows.length > 0) {
        organization_id = org.rows[0].id;
      }
    }

    // Create user
    const userData = {
      email,
      password_hash,
      first_name,
      last_name,
      organization_id,
      role: 'user'
    };

    const user = await db.createUser(userData);

    // Generate tokens
    const accessToken = PassportConfig.generateToken(user);
    const refreshToken = PassportConfig.generateRefreshToken();

    // Log registration
    await db.logAuditEvent({
      user_id: user.id,
      action: 'user_registered',
      resource_type: 'user',
      resource_id: user.id,
      details: { email, registration_method: 'local' },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      },
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: 86400
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_FAILED'
    });
  }
});

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      const accessToken = PassportConfig.generateToken(user);
      const refreshToken = PassportConfig.generateRefreshToken();

      // Log SSO login
      await db.logAuditEvent({
        user_id: user.id,
        action: 'sso_login',
        resource_type: 'user',
        resource_id: user.id,
        details: { provider: 'google' },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      // Redirect to frontend with tokens
      const redirectUrl = process.env.NODE_ENV === 'production'
        ? `https://poleplanpro.com/auth/callback?token=${accessToken}&refresh=${refreshToken}`
        : `http://localhost:3000/auth/callback?token=${accessToken}&refresh=${refreshToken}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      res.redirect('/auth/error?message=oauth_failed');
    }
  }
);

// Azure AD OAuth routes
router.get('/azure',
  passport.authenticate('azure_ad_oauth2')
);

router.get('/azure/callback',
  passport.authenticate('azure_ad_oauth2', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      const accessToken = PassportConfig.generateToken(user);
      const refreshToken = PassportConfig.generateRefreshToken();

      await db.logAuditEvent({
        user_id: user.id,
        action: 'sso_login',
        resource_type: 'user',
        resource_id: user.id,
        details: { provider: 'azure_ad' },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      const redirectUrl = process.env.NODE_ENV === 'production'
        ? `https://poleplanpro.com/auth/callback?token=${accessToken}&refresh=${refreshToken}`
        : `http://localhost:3000/auth/callback?token=${accessToken}&refresh=${refreshToken}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Azure AD OAuth callback error:', error);
      res.redirect('/auth/error?message=oauth_failed');
    }
  }
);

// SAML routes
router.get('/saml',
  passport.authenticate('saml')
);

router.post('/saml/callback',
  passport.authenticate('saml', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      const accessToken = PassportConfig.generateToken(user);
      const refreshToken = PassportConfig.generateRefreshToken();

      await db.logAuditEvent({
        user_id: user.id,
        action: 'sso_login',
        resource_type: 'user',
        resource_id: user.id,
        details: { provider: 'saml' },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      const redirectUrl = process.env.NODE_ENV === 'production'
        ? `https://poleplanpro.com/auth/callback?token=${accessToken}&refresh=${refreshToken}`
        : `http://localhost:3000/auth/callback?token=${accessToken}&refresh=${refreshToken}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('SAML callback error:', error);
      res.redirect('/auth/error?message=saml_failed');
    }
  }
);

// Token refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({
        error: 'Refresh token required',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    // Verify refresh token
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        error: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // Get user from database (verify still active)
    const user = await db.getUserById(decoded.sub);
    if (!user || !user.is_active) {
      return res.status(401).json({
        error: 'User not found or inactive',
        code: 'USER_INACTIVE'
      });
    }

    // Generate new tokens
    const accessToken = PassportConfig.generateToken(user);
    const newRefreshToken = PassportConfig.generateRefreshToken();

    res.json({
      success: true,
      tokens: {
        access_token: accessToken,
        refresh_token: newRefreshToken,
        token_type: 'Bearer',
        expires_in: 86400
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Token refresh failed',
      code: 'REFRESH_FAILED'
    });
  }
});

// Get current user info
router.get('/me', passport.authenticate('jwt', { session: false }), (req, res) => {
  const user = req.user;
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      organization_id: user.organization_id,
      organization_name: user.organization_name,
      preferences: user.preferences,
      last_login_at: user.last_login_at
    }
  });
});

// Logout
router.post('/logout', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    // In a production system, you might want to blacklist the JWT
    // For now, we just log the logout
    await db.logAuditEvent({
      user_id: req.user.id,
      action: 'user_logout',
      resource_type: 'user',
      resource_id: req.user.id,
      details: {},
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_FAILED'
    });
  }
});

export { router as authRouter };