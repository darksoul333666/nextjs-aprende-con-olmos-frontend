import { apiService } from './api';

export interface CartItem {
  courseId: {
    _id: string;
    title: string;
    description: string;
    thumbnail?: string;
    price: number;
    instructorId: {
      _id: string;
      name: string;
      title: string;
      photo?: string;
    };
  };
  price: number;
  addedAt: string;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartResponse {
  success: boolean;
  data: {
    cart: Cart;
  };
}

export interface CartCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

class CartService {
  // Obtener carrito del usuario
  async getCart(): Promise<Cart | null> {
    try {
      const response = await apiService.get<CartResponse>('/cart');
      return response.data?.cart || null;
    } catch (error) {
      console.error('Error fetching cart:', error);
      return null;
    }
  }

  // Obtener cantidad de items en el carrito
  async getCartCount(): Promise<number> {
    try {
      const response = await apiService.get<CartCountResponse>('/cart/count');
      return response.data?.count || 0;
    } catch (error) {
      console.error('Error fetching cart count:', error);
      return 0;
    }
  }

  // Agregar curso al carrito
  async addToCart(courseId: string): Promise<boolean> {
    try {
      await apiService.post('/cart/add', { courseId });
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  }

  // Remover curso del carrito
  async removeFromCart(courseId: string): Promise<boolean> {
    try {
      await apiService.delete(`/cart/remove/${courseId}`);
      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  }

  // Limpiar carrito completo
  async clearCart(): Promise<boolean> {
    try {
      await apiService.delete('/cart/clear');
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  }
}

export const cartService = new CartService();
