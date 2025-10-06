import React, { useState } from "react";

// Lazy load the import functionality
const loadImportFunctions = () => import("../utils/importers");

function ImportPanelLoading() {
  return (
    <div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-sm text-gray-600">
        Loading import tools...
      </span>
    </div>
  );
}

export default function LazyImportPanel({ onImport, children }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async (importData) => {
    setIsLoading(true);
    try {
      const importUtils = await loadImportFunctions();
      return await onImport(importData, importUtils);
    } catch (error) {
      console.error("Error loading import functionality:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <ImportPanelLoading />;
  }

  return children({ onImport: handleImport, isLoading });
}
