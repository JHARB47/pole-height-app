/**
 * CSV Export Customization Module
 * Allows users to customize CSV export columns, formats, and regulatory frameworks
 */

/**
 * Available regulatory frameworks for permit exports
 */
export const REGULATORY_FRAMEWORKS = {
  NESC: {
    id: "NESC",
    name: "National Electrical Safety Code (NESC)",
    description: "Standard electrical safety code in the United States",
    requiredFields: [
      "poleHeight",
      "clearances",
      "attachmentHeight",
      "powerHeight",
      "voltage",
    ],
  },
  CSA: {
    id: "CSA",
    name: "Canadian Standards Association (CSA)",
    description: "Canadian electrical safety standards",
    requiredFields: [
      "poleHeight",
      "clearances",
      "attachmentHeight",
      "powerHeight",
      "voltage",
      "province",
    ],
  },
  IEC: {
    id: "IEC",
    name: "International Electrotechnical Commission (IEC)",
    description: "International electrical standards",
    requiredFields: [
      "poleHeight",
      "clearances",
      "attachmentHeight",
      "powerHeight",
      "voltage",
      "country",
    ],
  },
  CUSTOM: {
    id: "CUSTOM",
    name: "Custom Framework",
    description: "User-defined custom framework",
    requiredFields: [],
  },
};

/**
 * Available CSV column definitions
 */
export const CSV_COLUMNS = {
  // Basic Pole Information
  poleId: {
    id: "poleId",
    label: "Pole ID",
    category: "basic",
    description: "Unique pole identifier",
    defaultInclude: true,
  },
  poleHeight: {
    id: "poleHeight",
    label: "Pole Height",
    category: "basic",
    description: "Total pole height",
    defaultInclude: true,
  },
  poleClass: {
    id: "poleClass",
    label: "Pole Class",
    category: "basic",
    description: "Structural pole classification",
    defaultInclude: true,
  },

  // Location Information
  latitude: {
    id: "latitude",
    label: "Latitude",
    category: "location",
    description: "Geographic latitude",
    defaultInclude: true,
  },
  longitude: {
    id: "longitude",
    label: "Longitude",
    category: "location",
    description: "Geographic longitude",
    defaultInclude: true,
  },
  address: {
    id: "address",
    label: "Address",
    category: "location",
    description: "Street address",
    defaultInclude: false,
  },

  // Electrical Information
  voltage: {
    id: "voltage",
    label: "Voltage",
    category: "electrical",
    description: "Power line voltage",
    defaultInclude: true,
  },
  powerHeight: {
    id: "powerHeight",
    label: "Power Height",
    category: "electrical",
    description: "Height of power attachment",
    defaultInclude: true,
  },
  hasTransformer: {
    id: "hasTransformer",
    label: "Has Transformer",
    category: "electrical",
    description: "Transformer presence indicator",
    defaultInclude: false,
  },

  // Clearances and Safety
  groundClearance: {
    id: "groundClearance",
    label: "Ground Clearance",
    category: "clearances",
    description: "Clearance to ground",
    defaultInclude: true,
  },
  powerToCommClearance: {
    id: "powerToCommClearance",
    label: "Power to Comm Clearance",
    category: "clearances",
    description: "Clearance between power and communication",
    defaultInclude: true,
  },
  roadClearance: {
    id: "roadClearance",
    label: "Road Clearance",
    category: "clearances",
    description: "Clearance over roadways",
    defaultInclude: true,
  },

  // Attachment Information
  attachmentHeight: {
    id: "attachmentHeight",
    label: "Attachment Height",
    category: "attachment",
    description: "Height of communication attachment",
    defaultInclude: true,
  },
  attachmentType: {
    id: "attachmentType",
    label: "Attachment Type",
    category: "attachment",
    description: "Type of attachment (strand, direct, etc.)",
    defaultInclude: false,
  },

  // Span Information
  spanDistance: {
    id: "spanDistance",
    label: "Span Distance",
    category: "span",
    description: "Distance to adjacent pole",
    defaultInclude: false,
  },
  adjacentPoleHeight: {
    id: "adjacentPoleHeight",
    label: "Adjacent Pole Height",
    category: "span",
    description: "Height of adjacent pole",
    defaultInclude: false,
  },

  // Compliance and Status
  complianceStatus: {
    id: "complianceStatus",
    label: "Compliance Status",
    category: "compliance",
    description: "NESC compliance status",
    defaultInclude: true,
  },
  permitStatus: {
    id: "permitStatus",
    label: "Permit Status",
    category: "compliance",
    description: "Permit approval status",
    defaultInclude: false,
  },

  // Metadata
  timestamp: {
    id: "timestamp",
    label: "Timestamp",
    category: "metadata",
    description: "Data collection timestamp",
    defaultInclude: false,
  },
  inspector: {
    id: "inspector",
    label: "Inspector",
    category: "metadata",
    description: "Inspector name",
    defaultInclude: false,
  },
  notes: {
    id: "notes",
    label: "Notes",
    category: "metadata",
    description: "Additional notes",
    defaultInclude: false,
  },
};

/**
 * Column categories for organization
 */
export const COLUMN_CATEGORIES = {
  basic: { id: "basic", label: "Basic Information", order: 1 },
  location: { id: "location", label: "Location", order: 2 },
  electrical: { id: "electrical", label: "Electrical", order: 3 },
  clearances: { id: "clearances", label: "Clearances", order: 4 },
  attachment: { id: "attachment", label: "Attachment", order: 5 },
  span: { id: "span", label: "Span Data", order: 6 },
  compliance: { id: "compliance", label: "Compliance", order: 7 },
  metadata: { id: "metadata", label: "Metadata", order: 8 },
};

/**
 * Get default column selection for a framework
 * @param {string} frameworkId - Regulatory framework ID
 * @returns {string[]} Array of column IDs
 */
export function getDefaultColumns(frameworkId = "NESC") {
  const framework = REGULATORY_FRAMEWORKS[frameworkId];
  const defaultColumns = Object.values(CSV_COLUMNS)
    .filter((col) => col.defaultInclude)
    .map((col) => col.id);

  if (framework && framework.requiredFields) {
    // Ensure all required fields are included
    framework.requiredFields.forEach((field) => {
      if (!defaultColumns.includes(field)) {
        defaultColumns.push(field);
      }
    });
  }

  return defaultColumns;
}

/**
 * Validate column selection against framework requirements
 * @param {string[]} selectedColumns - Selected column IDs
 * @param {string} frameworkId - Regulatory framework ID
 * @returns {{ valid: boolean, missingRequired?: string[], errors?: string[] }}
 */
export function validateColumnSelection(selectedColumns, frameworkId) {
  const framework = REGULATORY_FRAMEWORKS[frameworkId];

  if (!framework) {
    return {
      valid: false,
      errors: [`Unknown framework: ${frameworkId}`],
    };
  }

  if (frameworkId === "CUSTOM") {
    return { valid: true };
  }

  const missingRequired = framework.requiredFields.filter(
    (field) => !selectedColumns.includes(field),
  );

  if (missingRequired.length > 0) {
    return {
      valid: false,
      missingRequired,
      errors: [
        `Missing required fields for ${framework.name}: ${missingRequired.join(", ")}`,
      ],
    };
  }

  return { valid: true };
}

/**
 * CSV export preset configurations
 */
export const EXPORT_PRESETS = {
  BASIC: {
    id: "BASIC",
    name: "Basic Export",
    description: "Essential pole information only",
    columns: ["poleId", "poleHeight", "poleClass", "latitude", "longitude"],
  },
  FULL: {
    id: "FULL",
    name: "Complete Export",
    description: "All available fields",
    columns: Object.keys(CSV_COLUMNS),
  },
  PERMIT: {
    id: "PERMIT",
    name: "Permit Application",
    description: "Fields required for permit applications",
    columns: [
      "poleId",
      "poleHeight",
      "poleClass",
      "latitude",
      "longitude",
      "voltage",
      "powerHeight",
      "attachmentHeight",
      "groundClearance",
      "powerToCommClearance",
      "roadClearance",
      "complianceStatus",
    ],
  },
  FIELD: {
    id: "FIELD",
    name: "Field Survey",
    description: "Fields for field data collection",
    columns: [
      "poleId",
      "poleHeight",
      "poleClass",
      "latitude",
      "longitude",
      "attachmentHeight",
      "spanDistance",
      "timestamp",
      "inspector",
      "notes",
    ],
  },
};

/**
 * Format pole data for CSV export based on column selection
 * @param {any[]} poles - Array of pole objects
 * @param {string[]} selectedColumns - Selected column IDs
 * @param {any} options - Export options
 * @returns {any[]} Formatted data array
 */
export function formatDataForExport(poles, selectedColumns, options = {}) {
  const { useTickMarkFormat = false } = options;

  return poles.map((pole) => {
    const row = {};

    selectedColumns.forEach((columnId) => {
      const column = CSV_COLUMNS[columnId];
      if (!column) return;

      // Extract value based on column ID
      let value = pole[columnId];

      // Format specific fields
      if (columnId === "poleHeight" && useTickMarkFormat && value) {
        value = formatHeightWithTickMarks(value);
      }

      if (columnId === "hasTransformer") {
        value = value ? "Yes" : "No";
      }

      if (columnId === "timestamp" && value) {
        value = new Date(value).toLocaleString();
      }

      row[column.label] = value ?? "";
    });

    return row;
  });
}

/**
 * Format height value with tick marks (e.g., "15' 6\"")
 * @param {string|number} height - Height value
 * @returns {string} Formatted height
 */
function formatHeightWithTickMarks(height) {
  const str = String(height);
  const match = str.match(/(\d+)(?:ft)?\s*(\d+)?(?:in)?/i);

  if (match) {
    const feet = match[1];
    const inches = match[2] || "0";
    return `${feet}' ${inches}"`;
  }

  return str;
}

/**
 * Get column definitions by category
 * @returns {Record<string, any[]>} Columns grouped by category
 */
export function getColumnsByCategory() {
  const grouped = {};

  Object.values(CSV_COLUMNS).forEach((column) => {
    if (!grouped[column.category]) {
      grouped[column.category] = [];
    }
    grouped[column.category].push(column);
  });

  return grouped;
}
