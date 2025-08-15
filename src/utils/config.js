// Simple config accessor for Vite env vars
export const getConfig = () => ({
  tavityApiKey: import.meta?.env?.VITE_TAVITY_API_KEY || '',
});
