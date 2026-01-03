// @ts-nocheck
/**
 * Keyboard shortcut hook for error monitoring panel
 * Press Ctrl+Shift+E (or Cmd+Shift+E on Mac) to toggle
 */
import { useState, useEffect } from "react";

export function useErrorMonitoringShortcut() {
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "E" && e.shiftKey && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowPanel((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { showPanel, setShowPanel };
}
