import React from "react";

const HELP_KEY = "ppp_help_seen";

/**
 * Hook to manage help modal state with first-run detection
 */
export function useHelpModal() {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      const seen = localStorage.getItem(HELP_KEY);
      if (!seen) {
        setIsOpen(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const openHelp = () => setIsOpen(true);
  const closeHelp = () => setIsOpen(false);

  return { isOpen, openHelp, closeHelp };
}
