import { apiService } from './api';

export interface StripeConfig {
  publishableKey: string;
  currency: string;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface Purchase {
  _id: string;
  userId: string;
  courseId: {
    _id: string;
    title: string;
    description: string;
    instructorName: string;
    thumbnail?: string;
    price: number;
  };
  price: number;
  paymentMethod: string;
  stripeSessionId: string;
  stripeCustomerId: string;
  status: string;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
  stripePaymentIntentId: string;
}

export interface PurchasesResponse {
  purchases: Purchase[];
  total: number;
}

export interface CartCheckoutSession {
  sessionId: string;
  url: string;
  cartPurchase: {
    id: string;
    totalAmount: number;
    itemCount: number;
  };
}

export interface SessionStatus {
  success: boolean;
  data: {
    status: string;
    paymentStatus: string;
    customerEmail?: string;
  };
}

export interface ProcessResult {
  success: boolean;
  data: {
    purchase?: any;
    cartPurchase?: any;
    message: string;
  };
}

export const stripeService = {
  // Obtener configuración de Stripe
  async getConfig(): Promise<StripeConfig> {
    const response = await apiService.get<StripeConfig>('/stripe/config');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error loading Stripe config');
    }
    return response.data;
  },

  // Crear sesión de checkout
  async createCheckoutSession(courseId: string): Promise<CheckoutSession> {
    try {
      const response = await apiService.post<CheckoutSession>(`/stripe/create-checkout-session/${courseId}`, {
        id: courseId
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Error creating checkout session');
      }
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      if (!response.data.sessionId) {
        throw new Error('Invalid response format: missing sessionId');
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verificar estado de sesión
  async getSessionStatus(sessionId: string): Promise<any> {
    const response = await apiService.get<any>(`/stripe/session/${sessionId}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error loading session status');
    }
    return response.data;
  },

  // Procesar sesión de pago
  async processSession(sessionId: string): Promise<any> {
    const response = await apiService.post<any>('/stripe/process-session', {
      sessionId
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Error processing session');
    }
    
    return response.data;
  },

  // Obtener compras del usuario
  async getPurchases(): Promise<PurchasesResponse> {
    const response = await apiService.get<PurchasesResponse>('/purchases');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error loading purchases');
    }
    return response.data;
  },

  // === MÉTODOS PARA CARRITO ===

  // Crear sesión de checkout para carrito
  async createCartCheckoutSession(): Promise<CartCheckoutSession> {
    try {
      const response = await apiService.post<CartCheckoutSession>('/stripe/create-cart-checkout-session');
      
      if (!response.success) {
        throw new Error(response.message || 'Error creating cart checkout session');
      }
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      if (!response.data.sessionId) {
        throw new Error('Invalid response format: missing sessionId');
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener estado de sesión de carrito
  async getCartSessionStatus(sessionId: string): Promise<SessionStatus> {
    const response = await apiService.get<SessionStatus>(`/stripe/cart-session/${sessionId}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error loading cart session status');
    }
    return response.data;
  },

  // Procesar sesión de carrito
  async processCartSession(sessionId: string): Promise<ProcessResult> {
    const response = await apiService.post<ProcessResult>('/stripe/process-cart-session', {
      sessionId
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error processing cart session');
    }
    
    return response.data;
  }
};
