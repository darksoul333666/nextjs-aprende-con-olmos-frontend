"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { cartService, Cart } from "../services/cartService";
import { useAuth } from "./AuthContext";

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  isLoading: boolean;
  addToCart: (courseId: string) => Promise<void>;
  removeFromCart: (courseId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  isInCart: (courseId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const itemCount = cart?.itemCount || 0;

  // Cargar carrito inicial
  useEffect(() => {
    if (isAuthenticated && user?.role === "estudiante") {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated, user]);

  const refreshCart = async () => {
    if (!isAuthenticated || user?.role !== "estudiante") {
      setCart(null);
      return;
    }

    try {
      setIsLoading(true);
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch {
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (courseId: string) => {
    if (!isAuthenticated || user?.role !== "estudiante") {
      throw new Error("Usuario no autenticado o sin permisos");
    }

    try {
      setIsLoading(true);
      const success = await cartService.addToCart(courseId);
      if (success) {
        await refreshCart();
      } else {
        throw new Error("Error al agregar al carrito");
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (courseId: string) => {
    if (!isAuthenticated || user?.role !== "estudiante") {
      throw new Error("Usuario no autenticado o sin permisos");
    }

    try {
      setIsLoading(true);
      const success = await cartService.removeFromCart(courseId);
      if (success) {
        await refreshCart();
      } else {
        throw new Error("Error al remover del carrito");
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated || user?.role !== "estudiante") {
      throw new Error("Usuario no autenticado o sin permisos");
    }

    try {
      setIsLoading(true);
      const success = await cartService.clearCart();
      if (success) {
        await refreshCart();
      } else {
        throw new Error("Error al limpiar el carrito");
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const isInCart = (courseId: string): boolean => {
    if (!cart || !cart.items) return false;
    return cart.items.some((item) => item.courseId._id === courseId);
  };

  const value: CartContextType = {
    cart,
    itemCount,
    isLoading,
    addToCart,
    removeFromCart,
    clearCart,
    refreshCart,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
