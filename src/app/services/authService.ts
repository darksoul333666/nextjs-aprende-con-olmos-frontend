import { apiService } from "./api";

export interface User {
  _id: string;
  email: string;
  role: "estudiante" | "maestro";
  name?: string;
  scholarship?: {
    _id?: string;
    discountPercentage: number;
    isActive?: boolean;
  } | null;
  activeScholarship?: {
    _id?: string;
    discountPercentage: number;
    isActive?: boolean;
  } | null;
  scholarshipDiscountPercentage?: number;
  scholarshipDiscount?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  credential: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

const saveAuthData = (user: User, token: string) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

class AuthService {
  async login(
    credentials: LoginRequest,
  ): Promise<{ user: User; token: string }> {
    const response = await apiService.post<AuthResponse>(
      "/auth/login",
      credentials,
    );

    // La API devuelve: { success: boolean, message: string, data: { user, token } }
    if (
      response.success &&
      response.data &&
      response.data.user &&
      response.data.token
    ) {
      saveAuthData(response.data.user, response.data.token);
      return { user: response.data.user, token: response.data.token };
    } else {
      throw new Error(
        response.message ||
          "Respuesta de login inválida - estructura de datos incorrecta",
      );
    }
  }

  async register(
    userData: RegisterRequest,
  ): Promise<{ user: User; token: string }> {
    const response = await apiService.post<AuthResponse>(
      "/auth/register",
      userData,
    );

    // La API devuelve: { success: boolean, message: string, data: { user, token } }
    if (
      response.success &&
      response.data &&
      response.data.user &&
      response.data.token
    ) {
      saveAuthData(response.data.user, response.data.token);
      return { user: response.data.user, token: response.data.token };
    } else {
      throw new Error(
        response.message ||
          "Respuesta de registro inválida - estructura de datos incorrecta",
      );
    }
  }

  async googleLogin(
    googleData: GoogleLoginRequest,
  ): Promise<{ user: User; token: string }> {
    const response = await apiService.post<AuthResponse>(
      "/auth/google",
      googleData,
    );

    if (
      response.success &&
      response.data &&
      response.data.user &&
      response.data.token
    ) {
      saveAuthData(response.data.user, response.data.token);
      return { user: response.data.user, token: response.data.token };
    } else {
      throw new Error(
        response.message ||
          "Respuesta de Google login inválida - estructura de datos incorrecta",
      );
    }
  }

  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  saveCurrentUser(user: User): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("user", JSON.stringify(user));
  }

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
