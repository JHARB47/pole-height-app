// @ts-nocheck
/**
 * Authentication Service for Frontend
 * Handles JWT tokens, SSO, and user authentication state
 */

import { withErrorHandling } from "../utils/errorMonitoring.js";

class AuthService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:3001";
    this.tokenKey = "poleplan_token";
    this.refreshKey = "poleplan_refresh";
    this.userKey = "poleplan_user";

    // Initialize token refresh timer
    this.refreshTimer = null;
    this.setupTokenRefresh();
  }

  /**
   * Login with email and password
   */
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      this.handleAuthSuccess(data);
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      this.handleAuthSuccess(data);
      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${this.baseURL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      this.clearAuth();
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem(this.refreshKey);
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Token refresh failed");
      }

      this.handleTokenRefresh(data.tokens);
      return data.tokens;
    } catch (error) {
      console.error("Token refresh error:", error);
      this.clearAuth();
      throw error;
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    try {
      const token = this.getToken();
      if (!token) {
        return null;
      }

      const response = await fetch(`${this.baseURL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          await this.refreshToken();
          return this.getCurrentUser();
        }
        throw new Error("Failed to get user info");
      }

      const data = await response.json();
      localStorage.setItem(this.userKey, JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  }

  /**
   * Handle SSO callback
   */
  handleSSOCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const refreshToken = urlParams.get("refresh");

    if (token && refreshToken) {
      this.handleTokenRefresh({
        access_token: token,
        refresh_token: refreshToken,
      });

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);

      return true;
    }

    return false;
  }

  /**
   * Make authenticated API request
   */
  async apiRequest(endpoint, options = {}) {
    return withErrorHandling(
      async () => {
        const token = this.getToken();

        if (!token) {
          throw new Error("No authentication token available");
        }

        const config = {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
          },
        };

        let response = await fetch(`${this.baseURL}${endpoint}`, config);

        // If token expired, try to refresh and retry
        if (response.status === 401) {
          try {
            await this.refreshToken();

            // Update token in headers and retry
            config.headers.Authorization = `Bearer ${this.getToken()}`;
            response = await fetch(`${this.baseURL}${endpoint}`, config);
          } catch (refreshError) {
            console.error(
              "Token refresh failed during API request:",
              refreshError,
            );
            this.clearAuth();
            throw new Error("Authentication expired");
          }
        }

        return response;
      },
      { context: { operation: "api_request", endpoint } },
    );
  }

  /**
   * Handle successful authentication
   */
  handleAuthSuccess(data) {
    if (data.tokens) {
      localStorage.setItem(this.tokenKey, data.tokens.access_token);
      localStorage.setItem(this.refreshKey, data.tokens.refresh_token);
    }

    if (data.user) {
      localStorage.setItem(this.userKey, JSON.stringify(data.user));
    }

    this.setupTokenRefresh();
  }

  /**
   * Handle token refresh
   */
  handleTokenRefresh(tokens) {
    localStorage.setItem(this.tokenKey, tokens.access_token);
    localStorage.setItem(this.refreshKey, tokens.refresh_token);
    this.setupTokenRefresh();
  }

  /**
   * Clear authentication data
   */
  clearAuth() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
    localStorage.removeItem(this.userKey);

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Get stored token
   */
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Get stored user
   */
  getUser() {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Check if user has specific role
   */
  hasRole(role) {
    const user = this.getUser();
    return user && user.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles) {
    const user = this.getUser();
    return user && roles.includes(user.role);
  }

  /**
   * Setup automatic token refresh
   */
  setupTokenRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const token = this.getToken();
    if (!token) return;

    try {
      // Decode JWT to get expiration time
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeToRefresh = expTime - currentTime - 5 * 60 * 1000; // Refresh 5 minutes before expiry

      if (timeToRefresh > 0) {
        this.refreshTimer = setTimeout(() => {
          this.refreshToken().catch((error) => {
            console.error("Automatic token refresh failed:", error);
          });
        }, timeToRefresh);
      }
    } catch (error) {
      console.error("Failed to setup token refresh:", error);
    }
  }

  /**
   * Initialize SSO providers
   */
  initializeSSO() {
    // Add SSO button click handlers
    const googleBtn = document.getElementById("google-sso-btn");
    const azureBtn = document.getElementById("azure-sso-btn");
    const samlBtn = document.getElementById("saml-sso-btn");

    if (googleBtn) {
      googleBtn.addEventListener("click", () => {
        window.location.href = `${this.baseURL}/auth/google`;
      });
    }

    if (azureBtn) {
      azureBtn.addEventListener("click", () => {
        window.location.href = `${this.baseURL}/auth/azure`;
      });
    }

    if (samlBtn) {
      samlBtn.addEventListener("click", () => {
        window.location.href = `${this.baseURL}/auth/saml`;
      });
    }
  }
}

// Create and export singleton instance
export const authService = new AuthService();

// Auto-initialize on import
if (typeof window !== "undefined") {
  // Handle SSO callback on page load
  window.addEventListener("DOMContentLoaded", () => {
    authService.handleSSOCallback();
    authService.initializeSSO();
  });
}
