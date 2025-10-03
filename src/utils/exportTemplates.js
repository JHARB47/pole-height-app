/**
 * Export Template Management
 * Save, load, and manage custom CSV export templates
 */

const STORAGE_KEY = 'poleplan_export_templates';
const MAX_TEMPLATES = 20; // Limit to prevent localStorage bloat

/**
 * Built-in export templates for common use cases
 */
export const BUILT_IN_TEMPLATES = {
  BASIC: {
    id: 'basic',
    name: 'Basic Export',
    description: 'Essential pole information only',
    framework: 'CUSTOM',
    columns: ['id', 'height', 'latitude', 'longitude'],
    options: {
      useTickMarks: false,
      decimalPrecision: 6,
    },
    builtin: true,
  },
  NESC_FULL: {
    id: 'nesc_full',
    name: 'NESC Complete',
    description: 'All NESC compliance fields',
    framework: 'NESC',
    columns: [
      'id',
      'height',
      'latitude',
      'longitude',
      'groundLineClearance',
      'midspanClearance',
      'verticalClearance',
      'horizontalClearance',
      'loadCalculation',
    ],
    options: {
      useTickMarks: true,
      decimalPrecision: 2,
    },
    builtin: true,
  },
  CSA_STANDARD: {
    id: 'csa_standard',
    name: 'CSA Standard',
    description: 'CSA C22.3 compliance fields',
    framework: 'CSA',
    columns: [
      'id',
      'height',
      'latitude',
      'longitude',
      'csaSagCalculation',
      'csaClearanceVerification',
      'groundLineClearance',
    ],
    options: {
      useTickMarks: true,
      decimalPrecision: 2,
    },
    builtin: true,
  },
  GIS_EXPORT: {
    id: 'gis_export',
    name: 'GIS/Mapping',
    description: 'Optimized for GIS software import',
    framework: 'CUSTOM',
    columns: ['id', 'latitude', 'longitude', 'height', 'elevation'],
    options: {
      useTickMarks: false,
      decimalPrecision: 8, // High precision for GIS
    },
    builtin: true,
  },
  FIELD_COLLECTION: {
    id: 'field_collection',
    name: 'Field Collection',
    description: 'Data collected during field surveys',
    framework: 'CUSTOM',
    columns: [
      'id',
      'latitude',
      'longitude',
      'height',
      'collectedBy',
      'collectionDate',
      'notes',
    ],
    options: {
      useTickMarks: true,
      decimalPrecision: 6,
    },
    builtin: true,
  },
};

/**
 * Get all export templates (built-in + user-created)
 * @returns {Array} Array of template objects
 */
export function getAllTemplates() {
  const builtInTemplates = Object.values(BUILT_IN_TEMPLATES);
  const userTemplates = getUserTemplates();
  return [...builtInTemplates, ...userTemplates];
}

/**
 * Get user-created templates from localStorage
 * @returns {Array} Array of user template objects
 */
export function getUserTemplates() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const templates = JSON.parse(stored);
    return Array.isArray(templates) ? templates : [];
  } catch (error) {
    console.error('Error loading export templates:', error);
    return [];
  }
}

/**
 * Save a new export template
 * @param {Object} template - Template configuration
 * @param {string} template.name - Template name
 * @param {string} template.description - Template description
 * @param {string} template.framework - Regulatory framework (NESC, CSA, IEC, CUSTOM)
 * @param {Array<string>} template.columns - Column IDs to include
 * @param {Object} template.options - Export options (useTickMarks, decimalPrecision)
 * @returns {Object} Result object with success/error
 */
export function saveTemplate(template) {
  // Validation
  if (!template.name || !template.name.trim()) {
    return { success: false, error: 'Template name is required' };
  }

  if (!template.columns || template.columns.length === 0) {
    return { success: false, error: 'At least one column is required' };
  }

  try {
    const userTemplates = getUserTemplates();

    // Check template limit
    if (userTemplates.length >= MAX_TEMPLATES) {
      return {
        success: false,
        error: `Maximum ${MAX_TEMPLATES} templates allowed. Please delete old templates first.`,
      };
    }

    // Check for duplicate names
    const nameExists = userTemplates.some(
      t => t.name.toLowerCase() === template.name.toLowerCase()
    );
    if (nameExists) {
      return {
        success: false,
        error: 'A template with this name already exists',
      };
    }

    // Create new template with metadata
    const newTemplate = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: template.name.trim(),
      description: template.description?.trim() || '',
      framework: template.framework || 'CUSTOM',
      columns: template.columns,
      options: {
        useTickMarks: template.options?.useTickMarks ?? false,
        decimalPrecision: template.options?.decimalPrecision ?? 2,
      },
      builtin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to localStorage
    const updatedTemplates = [...userTemplates, newTemplate];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTemplates));

    return { success: true, template: newTemplate };
  } catch (error) {
    console.error('Error saving export template:', error);
    return { success: false, error: 'Failed to save template' };
  }
}

/**
 * Update an existing export template
 * @param {string} templateId - ID of template to update
 * @param {Object} updates - Fields to update
 * @returns {Object} Result object with success/error
 */
export function updateTemplate(templateId, updates) {
  // Can't update built-in templates (check by id property, not key)
  const isBuiltIn = Object.values(BUILT_IN_TEMPLATES).some(t => t.id === templateId);
  if (isBuiltIn) {
    return { success: false, error: 'Cannot modify built-in templates' };
  }

  try {
    const userTemplates = getUserTemplates();
    const templateIndex = userTemplates.findIndex(t => t.id === templateId);

    if (templateIndex === -1) {
      return { success: false, error: 'Template not found' };
    }

    // Update template
    const updatedTemplate = {
      ...userTemplates[templateIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    userTemplates[templateIndex] = updatedTemplate;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userTemplates));

    return { success: true, template: updatedTemplate };
  } catch (error) {
    console.error('Error updating export template:', error);
    return { success: false, error: 'Failed to update template' };
  }
}

/**
 * Delete an export template
 * @param {string} templateId - ID of template to delete
 * @returns {Object} Result object with success/error
 */
export function deleteTemplate(templateId) {
  // Can't delete built-in templates (check by id property, not key)
  const isBuiltIn = Object.values(BUILT_IN_TEMPLATES).some(t => t.id === templateId);
  if (isBuiltIn) {
    return { success: false, error: 'Cannot delete built-in templates' };
  }

  try {
    const userTemplates = getUserTemplates();
    const filteredTemplates = userTemplates.filter(t => t.id !== templateId);

    if (filteredTemplates.length === userTemplates.length) {
      return { success: false, error: 'Template not found' };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredTemplates));
    return { success: true };
  } catch (error) {
    console.error('Error deleting export template:', error);
    return { success: false, error: 'Failed to delete template' };
  }
}

/**
 * Get a specific template by ID
 * @param {string} templateId - Template ID
 * @returns {Object|null} Template object or null if not found
 */
export function getTemplateById(templateId) {
  // Check built-in templates first (search by id property, not key)
  const builtInTemplate = Object.values(BUILT_IN_TEMPLATES).find(t => t.id === templateId);
  if (builtInTemplate) {
    return builtInTemplate;
  }

  // Check user templates
  const userTemplates = getUserTemplates();
  return userTemplates.find(t => t.id === templateId) || null;
}

/**
 * Export all user templates as JSON (for backup/sharing)
 * @returns {string} JSON string of user templates
 */
export function exportUserTemplates() {
  const userTemplates = getUserTemplates();
  return JSON.stringify(userTemplates, null, 2);
}

/**
 * Import user templates from JSON (for restore/sharing)
 * @param {string} jsonString - JSON string of templates
 * @param {boolean} merge - If true, merge with existing; if false, replace
 * @returns {Object} Result object with success/error
 */
export function importUserTemplates(jsonString, merge = true) {
  try {
    const importedTemplates = JSON.parse(jsonString);

    if (!Array.isArray(importedTemplates)) {
      return { success: false, error: 'Invalid template format' };
    }

    const existingTemplates = merge ? getUserTemplates() : [];
    const allTemplates = [...existingTemplates, ...importedTemplates];

    // Remove duplicates by name
    const uniqueTemplates = allTemplates.reduce((acc, template) => {
      if (!acc.find(t => t.name === template.name)) {
        acc.push(template);
      }
      return acc;
    }, []);

    // Enforce limit
    const finalTemplates = uniqueTemplates.slice(0, MAX_TEMPLATES);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalTemplates));

    return {
      success: true,
      imported: importedTemplates.length,
      total: finalTemplates.length,
    };
  } catch (error) {
    console.error('Error importing templates:', error);
    return { success: false, error: 'Failed to import templates' };
  }
}
