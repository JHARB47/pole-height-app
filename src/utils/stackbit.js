/**
 * Stackbit visual editing utilities
 * https://docs.stackbit.com/reference/visual-editing
 */

/**
 * Generate data attributes for Stackbit visual editing
 * @param {string} objectId - The content object ID (e.g., "page", "section-0")
 * @param {string} [fieldPath] - Optional field path within the object (e.g., "title", "sections[0].title")
 * @returns {Object} Data attributes object to spread on elements
 */
export function stackbitData(objectId, fieldPath) {
  const attrs = {
    "data-sb-object-id": objectId,
  };

  if (fieldPath) {
    attrs["data-sb-field-path"] = fieldPath;
  }

  return attrs;
}

/**
 * Check if Stackbit visual editing is active
 * @returns {boolean}
 */
export function isStackbitActive() {
  return typeof window !== "undefined" && window.stackbitPreview;
}

/**
 * Generate object ID for a section
 * @param {number} index - Section index
 * @returns {string}
 */
export function sectionId(index) {
  return `section-${index}`;
}

/**
 * Generate field path for nested content
 * @param {string} basePath - Base path (e.g., "sections[0]")
 * @param {string} field - Field name (e.g., "title")
 * @returns {string}
 */
export function fieldPath(basePath, field) {
  return field ? `${basePath}.${field}` : basePath;
}
