// @ts-nocheck
import { authService } from "./auth.js";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

function handleResponse(response) {
  if (!response.ok) {
    return response
      .json()
      .catch(() => ({}))
      .then((payload) => {
        const error = new Error(
          payload?.error || "Template API request failed",
        );
        error.details = payload;
        error.status = response.status;
        throw error;
      });
  }

  return response.json();
}

class TemplateService {
  async listTemplates() {
    const res = await authService.apiRequest("/api/v1/templates", {
      method: "GET",
    });
    return handleResponse(res);
  }

  async getTemplate(templateId) {
    const res = await authService.apiRequest(
      `/api/v1/templates/${templateId}`,
      {
        method: "GET",
      },
    );
    return handleResponse(res);
  }

  async createTemplate(payload) {
    const res = await authService.apiRequest("/api/v1/templates", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  }

  async updateTemplate(templateId, payload) {
    const res = await authService.apiRequest(
      `/api/v1/templates/${templateId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
    return handleResponse(res);
  }

  async createVersion(templateId, payload) {
    const res = await authService.apiRequest(
      `/api/v1/templates/${templateId}/versions`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    return handleResponse(res);
  }
}

export const templateService = new TemplateService();
export default templateService;
