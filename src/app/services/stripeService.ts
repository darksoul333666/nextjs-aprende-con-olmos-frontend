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
    const response = await apiService.get('/stripe/config');
    return response.data;
  },

  // Crear sesión de checkout
  async createCheckoutSession(courseId: string): Promise<CheckoutSession> {
    const response = await apiService.post(`/stripe/create-checkout-session/${courseId}`, {
      id: courseId
    });
    return response.data;
  },

  // Verificar estado de sesión
  async getSessionStatus(sessionId: string): Promise<any> {
    const response = await apiService.get(`/stripe/session/${sessionId}`);
    return response.data;
  },

  // Obtener compras del usuario
  async getPurchases(): Promise<PurchasesResponse> {
    const response = await apiService.get('/purchases');
    return response.data;
  }
};
