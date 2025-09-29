// @ts-nocheck
/**
 * API Key Management Routes
 * Handles creation, validation, and management of API keys for third-party integrations
 */
import express from 'express';
import crypto from 'crypto';
import { DatabaseService } from '../services/database.js';
import { Logger } from '../services/logger.js';
import { rbacMiddleware } from '../middleware/rbac.js';

const router = express.Router();
const db = new DatabaseService();
const logger = new Logger();

/**
 * Get all API keys for the authenticated user
 */
router.get('/', rbacMiddleware(['apikeys:read']), async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(`
      SELECT 
        id,
        name,
        permissions,
        is_active,
        last_used_at,
        expires_at,
        created_at,
        SUBSTRING(key_hash, 1, 8) || '...' as key_preview
      FROM api_keys
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `, [userId]);

    res.json({
      success: true,
      api_keys: result.rows
    });
  } catch (error) {
    logger.error('Failed to fetch API keys:', error);
    res.status(500).json({
      error: 'Failed to fetch API keys',
      code: 'FETCH_FAILED'
    });
  }
});

/**
 * Create a new API key
 */
router.post('/', rbacMiddleware(['apikeys:write']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, permissions = [], expires_in_days } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        error: 'API key name is required',
        code: 'NAME_REQUIRED'
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        error: 'API key name must be 100 characters or less',
        code: 'NAME_TOO_LONG'
      });
    }

    // Check if user already has a key with this name
    const existingKey = await db.query(
      'SELECT id FROM api_keys WHERE user_id = $1 AND name = $2 AND deleted_at IS NULL',
      [userId, name]
    );

    if (existingKey.rows.length > 0) {
      return res.status(409).json({
        error: 'API key with this name already exists',
        code: 'NAME_EXISTS'
      });
    }

    // Generate API key
    const apiKey = generateApiKey();
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Calculate expiration date
    let expiresAt = null;
    if (expires_in_days && expires_in_days > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expires_in_days);
    }

    // Validate permissions
    const validPermissions = validatePermissions(permissions, req.user.role);

    // Create API key in database
    const keyData = {
      user_id: userId,
      name: name.trim(),
      key_hash: keyHash,
      permissions: validPermissions,
      expires_at: expiresAt
    };

    const createdKey = await db.createApiKey(keyData);

    // Log API key creation
    await db.logAuditEvent({
      user_id: userId,
      action: 'api_key_created',
      resource_type: 'api_key',
      resource_id: createdKey.id,
      details: { 
        name: name,
        permissions: validPermissions,
        expires_at: expiresAt
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    logger.info(`API key created for user ${userId}`, {
      keyId: createdKey.id,
      keyName: name,
      permissions: validPermissions
    });

    res.status(201).json({
      success: true,
      api_key: {
        id: createdKey.id,
        name: createdKey.name,
        key: apiKey, // Only returned once!
        permissions: createdKey.permissions,
        expires_at: expiresAt,
        created_at: createdKey.created_at
      },
      warning: 'Store this API key securely. It will not be shown again.'
    });
  } catch (error) {
    logger.error('Failed to create API key:', error);
    res.status(500).json({
      error: 'Failed to create API key',
      code: 'CREATION_FAILED'
    });
  }
});

/**
 * Update an API key (name, permissions, active status)
 */
router.put('/:keyId', rbacMiddleware(['apikeys:write']), async (req, res) => {
  try {
    const userId = req.user.id;
    const keyId = req.params.keyId;
    const { name, permissions, is_active } = req.body;

    // Verify key ownership
    const existingKey = await db.query(
      'SELECT * FROM api_keys WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [keyId, userId]
    );

    if (existingKey.rows.length === 0) {
      return res.status(404).json({
        error: 'API key not found',
        code: 'KEY_NOT_FOUND'
      });
    }

    const key = existingKey.rows[0];
    const updates = {};
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    // Update name if provided
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          error: 'API key name cannot be empty',
          code: 'NAME_REQUIRED'
        });
      }
      
      updates.name = name.trim();
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name.trim());
    }

    // Update permissions if provided
    if (permissions !== undefined) {
      const validPermissions = validatePermissions(permissions, req.user.role);
      updates.permissions = validPermissions;
      updateFields.push(`permissions = $${paramIndex++}`);
      updateValues.push(JSON.stringify(validPermissions));
    }

    // Update active status if provided
    if (is_active !== undefined) {
      updates.is_active = Boolean(is_active);
      updateFields.push(`is_active = $${paramIndex++}`);
      updateValues.push(Boolean(is_active));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update',
        code: 'NO_UPDATES'
      });
    }

    // Add updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(keyId, userId);

    const query = `
      UPDATE api_keys 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} AND deleted_at IS NULL
      RETURNING id, name, permissions, is_active, last_used_at, expires_at, created_at, updated_at
    `;

    const result = await db.query(query, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'API key not found or update failed',
        code: 'UPDATE_FAILED'
      });
    }

    // Log the update
    await db.logAuditEvent({
      user_id: userId,
      action: 'api_key_updated',
      resource_type: 'api_key',
      resource_id: keyId,
      details: updates,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    logger.info(`API key updated for user ${userId}`, {
      keyId: keyId,
      updates: updates
    });

    res.json({
      success: true,
      api_key: result.rows[0]
    });
  } catch (error) {
    logger.error('Failed to update API key:', error);
    res.status(500).json({
      error: 'Failed to update API key',
      code: 'UPDATE_FAILED'
    });
  }
});

/**
 * Delete an API key
 */
router.delete('/:keyId', rbacMiddleware(['apikeys:delete']), async (req, res) => {
  try {
    const userId = req.user.id;
    const keyId = req.params.keyId;

    // Verify key ownership and soft delete
    const result = await db.query(`
      UPDATE api_keys 
      SET deleted_at = CURRENT_TIMESTAMP, is_active = false
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
      RETURNING id, name
    `, [keyId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'API key not found',
        code: 'KEY_NOT_FOUND'
      });
    }

    const deletedKey = result.rows[0];

    // Log the deletion
    await db.logAuditEvent({
      user_id: userId,
      action: 'api_key_deleted',
      resource_type: 'api_key',
      resource_id: keyId,
      details: { name: deletedKey.name },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    logger.info(`API key deleted for user ${userId}`, {
      keyId: keyId,
      keyName: deletedKey.name
    });

    res.json({
      success: true,
      message: 'API key deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete API key:', error);
    res.status(500).json({
      error: 'Failed to delete API key',
      code: 'DELETION_FAILED'
    });
  }
});

/**
 * Get API key usage statistics
 */
router.get('/:keyId/usage', rbacMiddleware(['apikeys:read']), async (req, res) => {
  try {
    const userId = req.user.id;
    const keyId = req.params.keyId;

    // Verify key ownership
    const keyCheck = await db.query(
      'SELECT id, name FROM api_keys WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [keyId, userId]
    );

    if (keyCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'API key not found',
        code: 'KEY_NOT_FOUND'
      });
    }

    // Get usage statistics from audit logs
    const usageStats = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as requests,
        COUNT(DISTINCT action) as unique_actions
      FROM audit_logs
      WHERE details->>'api_key_id' = $1
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [keyId]);

    // Get recent activity
    const recentActivity = await db.query(`
      SELECT 
        action,
        resource_type,
        created_at,
        ip_address
      FROM audit_logs
      WHERE details->>'api_key_id' = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [keyId]);

    res.json({
      success: true,
      usage_stats: usageStats.rows,
      recent_activity: recentActivity.rows
    });
  } catch (error) {
    logger.error('Failed to fetch API key usage:', error);
    res.status(500).json({
      error: 'Failed to fetch usage statistics',
      code: 'USAGE_FETCH_FAILED'
    });
  }
});

/**
 * Generate a secure API key
 */
function generateApiKey() {
  const prefix = 'ppk_'; // PolePlan Key
  const randomBytes = crypto.randomBytes(32);
  const key = randomBytes.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return prefix + key;
}

/**
 * Validate and filter permissions based on user role
 */
function validatePermissions(permissions, userRole) {
  const allowedPermissions = {
    user: [
      'projects:read',
      'projects:write',
      'calculations:use',
      'exports:basic'
    ],
    engineer: [
      'projects:read',
      'projects:write',
      'projects:share',
      'calculations:use',
      'calculations:advanced',
      'exports:basic',
      'exports:all'
    ],
    admin: [
      'projects:read',
      'projects:write',
      'projects:delete',
      'projects:share',
      'calculations:use',
      'calculations:advanced',
      'exports:basic',
      'exports:all',
      'exports:bulk',
      'users:read',
      'audit:read'
    ],
    super_admin: ['*'] // All permissions
  };

  const userAllowedPermissions = allowedPermissions[userRole] || [];
  
  // If user is super_admin, allow all requested permissions
  if (userAllowedPermissions.includes('*')) {
    return Array.isArray(permissions) ? permissions : [];
  }

  // Filter permissions to only include those allowed for the user's role
  const validPermissions = Array.isArray(permissions) 
    ? permissions.filter(perm => userAllowedPermissions.includes(perm))
    : [];

  return validPermissions;
}

export { router as apiKeysRouter };