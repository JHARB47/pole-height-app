import React, { useState } from "react";

// Lazy load permit functionality
const loadPermitFunctions = () => import("../utils/permits");
const loadGeodataFunctions = () => import("../utils/geodata");

export default function LazyPermitGenerator({ onPermit, children }) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePermitGeneration = async (permitData) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const [permitUtils, geodataUtils] = await Promise.all([
        loadPermitFunctions(),
        loadGeodataFunctions(),
      ]);

      await onPermit(permitData, permitUtils, geodataUtils);
    } catch (error) {
      console.error("Error loading permit functionality:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return children({ onPermit: handlePermitGeneration, isLoading });
}
