// @ts-nocheck
/**
 * Role-Based Access Control (RBAC) Middleware
 * Comprehensive permission system with granular access control
 */
import { db } from '../services/db.js';
import { Logger } from '../services/logger.js';

const logger = new Logger();

/**
 * Permission matrix defining what each role can do
 */
const PERMISSIONS = {
  // Project permissions
  'projects:read': ['user', 'engineer', 'admin', 'super_admin'],
  'projects:write': ['user', 'engineer', 'admin', 'super_admin'],
  'projects:delete': ['engineer', 'admin', 'super_admin'],
  'projects:share': ['engineer', 'admin', 'super_admin'],
  'projects:all': ['admin', 'super_admin'],

  // User management
  'users:read': ['admin', 'super_admin'],
  'users:write': ['admin', 'super_admin'],
  'users:delete': ['super_admin'],

  // Organization management
  'org:read': ['admin', 'super_admin'],
  'org:write': ['admin', 'super_admin'],
  'org:delete': ['super_admin'],

  // Calculation permissions
  'calculations:use': ['user', 'engineer', 'admin', 'super_admin'],
  'calculations:advanced': ['engineer', 'admin', 'super_admin'],

  // Export permissions
  'exports:basic': ['user', 'engineer', 'admin', 'super_admin'],
  'exports:all': ['engineer', 'admin', 'super_admin'],
  'exports:bulk': ['admin', 'super_admin'],

  // API key management
  'apikeys:read': ['user', 'engineer', 'admin', 'super_admin'],
  'apikeys:write': ['engineer', 'admin', 'super_admin'],
  'apikeys:delete': ['admin', 'super_admin'],

  // Audit and monitoring
  'audit:read': ['admin', 'super_admin'],
  'metrics:read': ['admin', 'super_admin'],
  'health:read': ['admin', 'super_admin'],

  // System administration
  'system:config': ['super_admin'],
  'system:maintenance': ['super_admin']
};

/**
 * Check if user has specific permission
 */
export function hasPermission(userRole, permission) {
  // Super admin has all permissions
  if (userRole === 'super_admin') {
    return true;
  }

  // Check specific permission
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles && allowedRoles.includes(userRole);
}

/**
 * RBAC Middleware factory
 * @param {string|string[]} requiredRoles - Required roles or permissions
 * @param {Object} options - Additional options
 */
export function rbacMiddleware(requiredRoles = [], options = {}) {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const user = req.user;
      const userRole = user.role;

      // Convert single role to array
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

      // Check role-based access
      let hasAccess = false;

      for (const role of roles) {
        // Direct role match
        if (userRole === role) {
          hasAccess = true;
          break;
        }

        // Permission-based check
        if (role.includes(':') && hasPermission(userRole, role)) {
          hasAccess = true;
          break;
        }
      }

      if (!hasAccess) {
        logger.warn(`Access denied for user ${user.id} (${userRole}) to ${req.originalUrl}`, {
          userId: user.id,
          userRole: userRole,
          requiredRoles: roles,
          url: req.originalUrl,
          method: req.method
        });

        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: roles,
          current: userRole
        });
      }

      // Resource-level authorization
      if (options.resourceCheck) {
        const resourceAccess = await options.resourceCheck(req, user);
        if (!resourceAccess) {
          return res.status(403).json({
            error: 'Access denied to resource',
            code: 'RESOURCE_ACCESS_DENIED'
          });
        }
      }

      // Organization-level authorization
      if (options.organizationRequired && !user.organization_id) {
        return res.status(403).json({
          error: 'Organization membership required',
          code: 'ORG_REQUIRED'
        });
      }

      // Set user permissions in request for downstream use
      req.userPermissions = getUserPermissions(userRole);
      
      next();
    } catch (error) {
      logger.error('RBAC middleware error:', error);
      res.status(500).json({
        error: 'Authorization check failed',
        code: 'AUTH_CHECK_FAILED'
      });
    }
  };
}

/**
 * Get all permissions for a user role
 */
export function getUserPermissions(userRole) {
  const permissions = [];
  
  for (const [permission, allowedRoles] of Object.entries(PERMISSIONS)) {
    if (allowedRoles.includes(userRole) || userRole === 'super_admin') {
      permissions.push(permission);
    }
  }
  
  return permissions;
}

/**
 * Middleware to check project ownership or shared access
 */
export function projectAccessMiddleware(req, res, next) {
  return rbacMiddleware(['user', 'engineer', 'admin', 'super_admin'], {
    resourceCheck: async (req, user) => {
      const projectId = req.params.projectId || req.body.projectId;
      
      if (!projectId) {
        return true; // No specific project to check
      }

      // Super admin has access to all projects
      if (user.role === 'super_admin') {
        return true;
      }

      // Check if user owns the project or has shared access
      const result = await db.query(`
        SELECT p.* FROM projects p
        WHERE p.id = $1 
          AND (
            p.user_id = $2 
            OR p.organization_id = $3
            OR $2 = ANY(p.shared_with)
            OR p.is_public = true
          )
          AND p.deleted_at IS NULL
      `, [projectId, user.id, user.organization_id]);

      return result.rows.length > 0;
    }
  })(req, res, next);
}

/**
 * Middleware to check organization membership
 */
export function organizationAccessMiddleware(req, res, next) {
  return rbacMiddleware(['admin', 'super_admin'], {
    resourceCheck: async (req, user) => {
      const organizationId = req.params.organizationId || req.body.organizationId;
      
      if (!organizationId) {
        return true;
      }

      // Super admin has access to all organizations
      if (user.role === 'super_admin') {
        return true;
      }

      // Check organization membership
      return user.organization_id === organizationId;
    }
  })(req, res, next);
}

/**
 * API Key based authentication middleware
 */
export async function apiKeyMiddleware(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        code: 'API_KEY_REQUIRED'
      });
    }

    // Hash the API key for database lookup
    const crypto = await import('crypto');
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    const keyData = await db.validateApiKey(keyHash);
    
    if (!keyData) {
      return res.status(401).json({
        error: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
    }

    // Set user context from API key
    req.user = {
      id: keyData.user_id,
      email: keyData.email,
      role: keyData.role,
      organization_id: keyData.organization_id,
      apiKeyPermissions: keyData.permissions
    };

    // Set API key permissions
    req.userPermissions = keyData.permissions;
    req.authMethod = 'api_key';
    
    next();
  } catch (error) {
    logger.error('API key middleware error:', error);
    res.status(500).json({
      error: 'API key validation failed',
      code: 'API_KEY_VALIDATION_FAILED'
    });
  }
}

/**
 * Combined authentication middleware (JWT or API Key)
 */
export function flexibleAuthMiddleware(req, res, next) {
  // Check for API key first
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (apiKey) {
    return apiKeyMiddleware(req, res, next);
  }
  
  // Fall back to JWT authentication
  return passport.authenticate('jwt', { session: false })(req, res, next);
}