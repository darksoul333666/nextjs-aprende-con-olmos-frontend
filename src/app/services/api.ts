const API_BASE_URL = "http://localhost:3200/api";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiService {
  private getAuthHeaders(includeContentType = true): HeadersInit {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      ...(includeContentType && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const text = await response.text();
    const data = text
      ? (JSON.parse(text) as ApiResponse<T>)
      : ({ success: response.ok } as ApiResponse<T>);

    if (!response.ok) {
      throw new Error(data.message || data.error || "Error en la petición");
    }

    return data;
  }

  private isFormData(data: unknown): data is FormData {
    return typeof FormData !== "undefined" && data instanceof FormData;
  }

  private getBody(data?: unknown): BodyInit | undefined {
    if (!data) {
      return undefined;
    }

    if (this.isFormData(data)) {
      return data;
    }

    return JSON.stringify(data);
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, unknown>,
  ): Promise<ApiResponse<T>> {
    const url = new URL(`${API_BASE_URL}${endpoint}`);

    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key].toString());
        }
      });
    }

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const isFormData = this.isFormData(data);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: this.getAuthHeaders(!isFormData),
      body: this.getBody(data),
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const isFormData = this.isFormData(data);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: this.getAuthHeaders(!isFormData),
      body: this.getBody(data),
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const isFormData = this.isFormData(data);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers: this.getAuthHeaders(!isFormData),
      body: this.getBody(data),
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<T>(response);
  }
}

export const apiService = new ApiService();
