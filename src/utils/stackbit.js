/**
 * Stackbit visual editing utilities
 * https://docs.stackbit.com/reference/visual-editing
 */

/**
 * Generate data attributes for Stackbit visual editing
 * @param {string} objectId - The content object ID (e.g., content/pages/home.json)
 * @param {string} [fieldPath] - Optional field path within the object (e.g., "title")
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
 * Build a Stackbit object identifier from a content source.
 * @param {string} source - Path such as "../../content/pages/home.json"
 * @param {string} [pointer] - Optional pointer, e.g., "sections[0]"
 * @returns {string}
 */
export function stackbitObjectId(source, pointer) {
  if (!source) return pointer || "";
  const normalized = source.replace(/^[./]+/, "");
  return pointer ? `${normalized}:${pointer}` : normalized;
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
