/**
 * Tests for Export Template Management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  BUILT_IN_TEMPLATES,
  getAllTemplates,
  getUserTemplates,
  saveTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateById,
  exportUserTemplates,
  importUserTemplates,
} from "../exportTemplates";

const STORAGE_KEY = "poleplan_export_templates";

describe("Export Templates", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Built-in Templates", () => {
    it("should have all required built-in templates", () => {
      expect(BUILT_IN_TEMPLATES.BASIC).toBeDefined();
      expect(BUILT_IN_TEMPLATES.NESC_FULL).toBeDefined();
      expect(BUILT_IN_TEMPLATES.CSA_STANDARD).toBeDefined();
      expect(BUILT_IN_TEMPLATES.GIS_EXPORT).toBeDefined();
      expect(BUILT_IN_TEMPLATES.FIELD_COLLECTION).toBeDefined();
    });

    it("should mark built-in templates correctly", () => {
      Object.values(BUILT_IN_TEMPLATES).forEach((template) => {
        expect(template.builtin).toBe(true);
      });
    });

    it("should have valid structure for built-in templates", () => {
      Object.values(BUILT_IN_TEMPLATES).forEach((template) => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.framework).toBeDefined();
        expect(Array.isArray(template.columns)).toBe(true);
        expect(template.columns.length).toBeGreaterThan(0);
        expect(template.options).toBeDefined();
      });
    });
  });

  describe("getAllTemplates", () => {
    it("should return built-in templates when no user templates exist", () => {
      const templates = getAllTemplates();
      const builtInCount = Object.keys(BUILT_IN_TEMPLATES).length;

      expect(templates.length).toBe(builtInCount);
      expect(templates.every((t) => t.builtin)).toBe(true);
    });

    it("should return built-in + user templates", () => {
      const userTemplate = {
        id: "user_test",
        name: "Test Template",
        framework: "CUSTOM",
        columns: ["id", "height"],
        options: { useTickMarks: false },
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify([userTemplate]));

      const templates = getAllTemplates();
      const builtInCount = Object.keys(BUILT_IN_TEMPLATES).length;

      expect(templates.length).toBe(builtInCount + 1);
      expect(templates.find((t) => t.id === "user_test")).toBeDefined();
    });
  });

  describe("saveTemplate", () => {
    it("should save a valid template", () => {
      const template = {
        name: "My Template",
        description: "Test description",
        framework: "NESC",
        columns: ["id", "height", "latitude"],
        options: { useTickMarks: true, decimalPrecision: 2 },
      };

      const result = saveTemplate(template);

      expect(result.success).toBe(true);
      expect(result.template).toBeDefined();
      expect(result.template.id).toBeDefined();
      expect(result.template.createdAt).toBeDefined();
      expect(result.template.updatedAt).toBeDefined();
      expect(result.template.builtin).toBe(false);
    });

    it("should reject template without name", () => {
      const template = {
        framework: "NESC",
        columns: ["id", "height"],
        options: {},
      };

      const result = saveTemplate(template);

      expect(result.success).toBe(false);
      expect(result.error).toContain("name is required");
    });

    it("should reject template without columns", () => {
      const template = {
        name: "Test",
        framework: "NESC",
        columns: [],
        options: {},
      };

      const result = saveTemplate(template);

      expect(result.success).toBe(false);
      expect(result.error).toContain("column");
    });

    it("should reject duplicate template names", () => {
      const template = {
        name: "Duplicate",
        framework: "NESC",
        columns: ["id"],
        options: {},
      };

      saveTemplate(template);
      const result = saveTemplate(template);

      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");
    });

    it("should enforce template limit", () => {
      // Create 20 templates
      const templates = Array.from({ length: 20 }, (_, i) => ({
        id: `template_${i}`,
        name: `Template ${i}`,
        framework: "CUSTOM",
        columns: ["id"],
        options: {},
      }));

      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));

      // Try to add one more
      const result = saveTemplate({
        name: "Overflow Template",
        framework: "CUSTOM",
        columns: ["id"],
        options: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Maximum");
    });
  });

  describe("updateTemplate", () => {
    it("should update an existing user template", () => {
      const template = {
        name: "Original",
        framework: "NESC",
        columns: ["id", "height"],
        options: { useTickMarks: false },
      };

      const saved = saveTemplate(template);

      const result = updateTemplate(saved.template.id, {
        name: "Updated",
        columns: ["id", "height", "latitude"],
      });

      expect(result.success).toBe(true);
      expect(result.template.name).toBe("Updated");
      expect(result.template.columns).toContain("latitude");
      expect(result.template.updatedAt).toBeDefined();
    });

    it("should not allow updating built-in templates", () => {
      const result = updateTemplate("basic", { name: "Modified" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("built-in");
    });

    it("should return error for non-existent template", () => {
      const result = updateTemplate("nonexistent", { name: "Updated" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("deleteTemplate", () => {
    it("should delete a user template", () => {
      const template = {
        name: "To Delete",
        framework: "CUSTOM",
        columns: ["id"],
        options: {},
      };

      const saved = saveTemplate(template);
      const result = deleteTemplate(saved.template.id);

      expect(result.success).toBe(true);

      const remaining = getUserTemplates();
      expect(remaining.find((t) => t.id === saved.template.id)).toBeUndefined();
    });

    it("should not allow deleting built-in templates", () => {
      const result = deleteTemplate("basic");

      expect(result.success).toBe(false);
      expect(result.error).toContain("built-in");
    });

    it("should return error for non-existent template", () => {
      const result = deleteTemplate("nonexistent");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("getTemplateById", () => {
    it("should retrieve built-in template", () => {
      const template = getTemplateById("basic");

      expect(template).toBeDefined();
      expect(template.id).toBe("basic");
      expect(template.builtin).toBe(true);
    });

    it("should retrieve user template", () => {
      const template = {
        name: "User Template",
        framework: "CUSTOM",
        columns: ["id"],
        options: {},
      };

      const saved = saveTemplate(template);
      const retrieved = getTemplateById(saved.template.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(saved.template.id);
      expect(retrieved.builtin).toBe(false);
    });

    it("should return null for non-existent template", () => {
      const template = getTemplateById("nonexistent");
      expect(template).toBeNull();
    });
  });

  describe("Import/Export", () => {
    it("should export user templates as JSON", () => {
      const template = {
        name: "Export Test",
        framework: "NESC",
        columns: ["id", "height"],
        options: { useTickMarks: true },
      };

      saveTemplate(template);

      const exported = exportUserTemplates();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
      expect(parsed[0].name).toBe("Export Test");
    });

    it("should import templates (merge mode)", () => {
      // Create existing template
      saveTemplate({
        name: "Existing",
        framework: "CUSTOM",
        columns: ["id"],
        options: {},
      });

      // Import new templates
      const imported = JSON.stringify([
        {
          id: "imported_1",
          name: "Imported 1",
          framework: "NESC",
          columns: ["id", "height"],
          options: {},
        },
        {
          id: "imported_2",
          name: "Imported 2",
          framework: "CSA",
          columns: ["id", "height", "latitude"],
          options: {},
        },
      ]);

      const result = importUserTemplates(imported, true);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
      expect(result.total).toBe(3); // 1 existing + 2 imported

      const templates = getUserTemplates();
      expect(templates.length).toBe(3);
    });

    it("should import templates (replace mode)", () => {
      // Create existing template
      saveTemplate({
        name: "Existing",
        framework: "CUSTOM",
        columns: ["id"],
        options: {},
      });

      // Import (replace)
      const imported = JSON.stringify([
        {
          id: "imported_1",
          name: "Imported 1",
          framework: "NESC",
          columns: ["id"],
          options: {},
        },
      ]);

      const result = importUserTemplates(imported, false);

      expect(result.success).toBe(true);
      expect(result.total).toBe(1);

      const templates = getUserTemplates();
      expect(templates.length).toBe(1);
      expect(templates[0].name).toBe("Imported 1");
    });

    it("should reject invalid JSON", () => {
      const result = importUserTemplates("invalid json", true);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
