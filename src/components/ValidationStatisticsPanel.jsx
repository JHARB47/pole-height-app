/**
 * Validation Statistics Panel
 * Shows aggregate validation statistics for all poles in the project
 */

import React, { useMemo } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { validatePoleCoordinates } from '../utils/gisValidation.js';

/**
 * Calculate validation statistics for a collection of poles
 * @param {Array} poles - Array of pole objects with latitude/longitude
 * @returns {Object} Statistics object
 */
function calculateValidationStats(poles) {
  if (!poles || poles.length === 0) {
    return {
      total: 0,
      valid: 0,
      withWarnings: 0,
      withErrors: 0,
      errorDetails: [],
      warningDetails: [],
    };
  }

  const stats = {
    total: poles.length,
    valid: 0,
    withWarnings: 0,
    withErrors: 0,
    errorDetails: [],
    warningDetails: [],
  };

  poles.forEach((pole, index) => {
    // Skip poles without coordinates
    if (!pole.latitude || !pole.longitude) {
      return;
    }

    const validation = validatePoleCoordinates(pole.latitude, pole.longitude);

    if (validation.errors.length > 0) {
      stats.withErrors++;
      stats.errorDetails.push({
        poleId: pole.id || `Pole ${index + 1}`,
        errors: validation.errors,
      });
    } else if (validation.warnings.length > 0) {
      stats.withWarnings++;
      stats.warningDetails.push({
        poleId: pole.id || `Pole ${index + 1}`,
        warnings: validation.warnings,
      });
    } else if (validation.valid) {
      stats.valid++;
    }
  });

  return stats;
}

/**
 * Validation Statistics Panel Component
 */
export function ValidationStatisticsPanel({ poles, className = '' }) {
  const stats = useMemo(() => calculateValidationStats(poles), [poles]);

  if (stats.total === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <Info className="w-5 h-5" />
          <span>No poles with coordinates to validate</span>
        </div>
      </div>
    );
  }

  const validPercentage = Math.round((stats.valid / stats.total) * 100);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Validation Summary</h3>
        <p className="text-sm text-gray-500 mt-1">
          {stats.total} pole{stats.total !== 1 ? 's' : ''} with coordinates
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
        {/* Valid Count */}
        <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold text-green-900">{stats.valid}</p>
            <p className="text-sm text-green-700">Valid</p>
            <p className="text-xs text-green-600 mt-1">{validPercentage}% of total</p>
          </div>
        </div>

        {/* Warnings Count */}
        <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold text-yellow-900">{stats.withWarnings}</p>
            <p className="text-sm text-yellow-700">Warnings</p>
            <p className="text-xs text-yellow-600 mt-1">Review recommended</p>
          </div>
        </div>

        {/* Errors Count */}
        <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold text-red-900">{stats.withErrors}</p>
            <p className="text-sm text-red-700">Errors</p>
            <p className="text-xs text-red-600 mt-1">Action required</p>
          </div>
        </div>
      </div>

      {/* Error Details */}
      {stats.errorDetails.length > 0 && (
        <div className="px-4 pb-4">
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-red-900 hover:text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              View {stats.errorDetails.length} Error{stats.errorDetails.length !== 1 ? 's' : ''}
              <span className="text-gray-400 group-open:rotate-90 transition-transform">▶</span>
            </summary>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {stats.errorDetails.map((detail, idx) => (
                <div key={idx} className="p-2 bg-red-50 rounded text-xs border border-red-200">
                  <p className="font-semibold text-red-900">{detail.poleId}</p>
                  <ul className="mt-1 space-y-1 text-red-700 list-disc list-inside">
                    {detail.errors.map((error, errorIdx) => (
                      <li key={errorIdx}>{error}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Warning Details */}
      {stats.warningDetails.length > 0 && (
        <div className="px-4 pb-4">
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-yellow-900 hover:text-yellow-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              View {stats.warningDetails.length} Warning{stats.warningDetails.length !== 1 ? 's' : ''}
              <span className="text-gray-400 group-open:rotate-90 transition-transform">▶</span>
            </summary>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {stats.warningDetails.map((detail, idx) => (
                <div key={idx} className="p-2 bg-yellow-50 rounded text-xs border border-yellow-200">
                  <p className="font-semibold text-yellow-900">{detail.poleId}</p>
                  <ul className="mt-1 space-y-1 text-yellow-700 list-disc list-inside">
                    {detail.warnings.map((warning, warningIdx) => (
                      <li key={warningIdx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

export default ValidationStatisticsPanel;
