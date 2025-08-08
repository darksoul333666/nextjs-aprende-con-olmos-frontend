import { log } from 'console';
import { apiService } from './api';

export interface User {
  id: string;
  email: string;
  role: 'estudiante' | 'maestro';
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<{ user: User; token: string }> {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    
    // Según la respuesta real: { success: boolean, message: string, data: { user, token } }
    if (response.data) {
      console.log(response.data)
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return { user: response.data.user, token: response.data.token };
    } else {
      console.error('Unexpected response structure:', response);
      throw new Error('Respuesta de login inválida - estructura de datos incorrecta');
    }
  }

  async register(userData: RegisterRequest): Promise<{ user: User; token: string }> {
    const response = await apiService.post<AuthResponse>('/auth/register', userData);
    
    // Según la respuesta real: { success: boolean, message: string, data: { user, token } }
    if (response.data && response.data && response.data.user && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return { user: response.data.user, token: response.data.token };
    } else {
      console.error('Unexpected response structure:', response);
      throw new Error('Respuesta de registro inválida - estructura de datos incorrecta');
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
