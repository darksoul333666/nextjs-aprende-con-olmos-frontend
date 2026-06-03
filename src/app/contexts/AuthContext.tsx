"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authService, User } from "../services/authService";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted to prevent hydration mismatch
    setIsMounted(true);

    // Verificar si hay un usuario autenticado al cargar la aplicación
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.login({ email, password });

      // El servicio ahora devuelve directamente { user, token }
      if (response.user) {
        setUser(response.user);
      } else {
        throw new Error(
          "Respuesta de login inválida - estructura de datos incorrecta",
        );
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.register({ email, password });

      // El servicio ahora devuelve directamente { user, token }
      if (response.user) {
        setUser(response.user);
      } else {
        throw new Error(
          "Respuesta de registro inválida - estructura de datos incorrecta",
        );
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user: isMounted ? user : null,
    isLoading: isMounted ? isLoading : true,
    login,
    register,
    logout,
    isAuthenticated: isMounted ? !!user : false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
