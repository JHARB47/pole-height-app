/**
 * CSV Export Customization Dialog
 * Allows users to customize CSV export columns and formats
 */
import React, { useState, useMemo } from "react";
import {
  CSV_COLUMNS,
  COLUMN_CATEGORIES,
  REGULATORY_FRAMEWORKS,
  EXPORT_PRESETS,
  getDefaultColumns,
  validateColumnSelection,
  getColumnsByCategory,
} from "../utils/csvCustomization.js";

export default function CSVExportDialog({ poles = [], onExport, onClose }) {
  const [selectedFramework, setSelectedFramework] = useState("NESC");
  const [selectedColumns, setSelectedColumns] = useState(() =>
    getDefaultColumns("NESC"),
  );
  const [selectedPreset, setSelectedPreset] = useState("PERMIT");
  const [useTickMarkFormat, setUseTickMarkFormat] = useState(false);

  const columnsByCategory = useMemo(() => getColumnsByCategory(), []);

  const validation = useMemo(
    () => validateColumnSelection(selectedColumns, selectedFramework),
    [selectedColumns, selectedFramework],
  );

  const handleFrameworkChange = (frameworkId) => {
    setSelectedFramework(frameworkId);
    setSelectedColumns(getDefaultColumns(frameworkId));
  };

  const handlePresetChange = (presetId) => {
    setSelectedPreset(presetId);
    const preset = EXPORT_PRESETS[presetId];
    if (preset) {
      setSelectedColumns(preset.columns);
    }
  };

  const handleColumnToggle = (columnId) => {
    setSelectedColumns((prev) => {
      if (prev.includes(columnId)) {
        return prev.filter((id) => id !== columnId);
      } else {
        return [...prev, columnId];
      }
    });
  };

  const handleSelectAll = (category) => {
    const categoryColumns = columnsByCategory[category].map((col) => col.id);
    setSelectedColumns((prev) => {
      const hasAll = categoryColumns.every((id) => prev.includes(id));
      if (hasAll) {
        return prev.filter((id) => !categoryColumns.includes(id));
      } else {
        return [...new Set([...prev, ...categoryColumns])];
      }
    });
  };

  const handleExport = () => {
    if (!validation.valid) {
      alert(`Cannot export: ${validation.errors.join(", ")}`);
      return;
    }

    onExport({
      framework: selectedFramework,
      columns: selectedColumns,
      useTickMarkFormat,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">
            Customize CSV Export
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Select columns and regulatory framework for your export
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Framework Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Regulatory Framework
            </label>
            <select
              value={selectedFramework}
              onChange={(e) => handleFrameworkChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.values(REGULATORY_FRAMEWORKS).map((framework) => (
                <option key={framework.id} value={framework.id}>
                  {framework.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {REGULATORY_FRAMEWORKS[selectedFramework]?.description}
            </p>
          </div>

          {/* Preset Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Preset
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(EXPORT_PRESETS).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetChange(preset.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                    selectedPreset === preset.id
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="font-semibold">{preset.name}</div>
                  <div className="text-xs opacity-75">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Column Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Columns ({selectedColumns.length} selected)
            </label>

            {Object.entries(COLUMN_CATEGORIES).map(([categoryId, category]) => {
              const categoryColumns = columnsByCategory[categoryId] || [];
              if (categoryColumns.length === 0) return null;

              const allSelected = categoryColumns.every((col) =>
                selectedColumns.includes(col.id),
              );

              return (
                <div key={categoryId} className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      {category.label}
                    </h3>
                    <button
                      onClick={() => handleSelectAll(categoryId)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {allSelected ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {categoryColumns.map((column) => (
                      <label
                        key={column.id}
                        className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(column.id)}
                          onChange={() => handleColumnToggle(column.id)}
                          className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {column.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {column.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Format Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format Options
            </label>
            <label className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={useTickMarkFormat}
                onChange={(e) => setUseTickMarkFormat(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Use Tick Mark Format
                </div>
                <div className="text-xs text-gray-500">
                  Display heights as 15' 6" instead of 15ft 6in
                </div>
              </div>
            </label>
          </div>

          {/* Validation Messages */}
          {!validation.valid && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-red-400 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Validation Errors
                  </h3>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {validation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Export Preview */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-900">
              <strong>Export Preview:</strong> {poles.length} pole(s) with{" "}
              {selectedColumns.length} column(s)
              <br />
              <strong>Framework:</strong>{" "}
              {REGULATORY_FRAMEWORKS[selectedFramework]?.name}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={!validation.valid}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              validation.valid
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
