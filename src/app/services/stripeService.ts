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
  id: string;
  courseId: string;
  price: number;
  status: string;
  purchaseDate: string;
  course: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    instructorName: string;
  };
}

export interface PurchasesResponse {
  purchases: Purchase[];
  total: number;
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

  // Obtener compras del usuario
  async getPurchases(): Promise<PurchasesResponse> {
    const response = await apiService.get<PurchasesResponse>('/purchases');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error loading purchases');
    }
    return response.data;
  }
};
