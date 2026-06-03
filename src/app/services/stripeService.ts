import { apiService } from "./api";

// Importar la base URL del API
const API_BASE_URL = "http://localhost:3200/api";

export interface StripeConfig {
  publishableKey: string;
  currency: string;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

// Nuevo tipo para compras agrupadas
export interface PurchaseGroup {
  id: string;
  purchaseDate: string;
  totalAmount: number;
  itemCount: number;
  paymentMethod: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeCustomerId?: string;
  status: "pending" | "completed" | "cancelled" | "refunded";
  isGroupedPurchase: boolean;
  groupTotalAmount?: number;
  groupItemCount?: number;
  courses: PurchaseItem[];
}

export interface PurchaseItem {
  id: string;
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
  purchaseDate: string;
}

export interface PurchasesResponse {
  success: boolean;
  data: {
    purchases: PurchaseGroup[];
    totalPurchases: number;
    totalCourses: number;
  };
}

// Mantener la interfaz anterior para compatibilidad
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
    const response = await apiService.get<StripeConfig>("/stripe/config");
    if (!response.success || !response.data) {
      throw new Error(response.message || "Error loading Stripe config");
    }
    return response.data;
  },

  // Crear sesión de checkout
  async createCheckoutSession(courseId: string): Promise<CheckoutSession> {
    try {
      const response = await apiService.post<CheckoutSession>(
        `/stripe/create-checkout-session/${courseId}`,
        {
          id: courseId,
        },
      );

      if (!response.success) {
        throw new Error(response.message || "Error creating checkout session");
      }

      if (!response.data) {
        throw new Error("No data received from server");
      }

      if (!response.data.sessionId) {
        throw new Error("Invalid response format: missing sessionId");
      }

      return response.data;
    } catch {
      throw error;
    }
  },

  // Verificar estado de sesión
  async getSessionStatus(sessionId: string): Promise<any> {
    const response = await apiService.get<any>(`/stripe/session/${sessionId}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || "Error loading session status");
    }
    return response.data;
  },

  // Procesar sesión de pago
  async processSession(sessionId: string): Promise<any> {
    const response = await apiService.post<any>("/stripe/process-session", {
      sessionId,
    });

    if (!response.success) {
      throw new Error(response.message || "Error processing session");
    }

    return response.data;
  },

  // Obtener compras del usuario
  async getPurchases(): Promise<PurchaseGroup[]> {
    const response = await apiService.get<{
      purchases: PurchaseGroup[];
      totalPurchases: number;
      totalCourses: number;
    }>("/purchases");
    if (!response.success || !response.data) {
      throw new Error(response.message || "Error loading purchases");
    }
    return response.data.purchases;
  },

  // Descargar comprobante de pago en PDF
  async downloadReceiptPDF(purchaseGroupId: string): Promise<void> {
    try {
      // Extraer el ID real de la base de datos (remover prefijos como "individual_", "cart_", etc.)
      const actualId = purchaseGroupId.replace(
        /^(individual_|cart_|group_)/,
        "",
      );

      const response = await fetch(`${API_BASE_URL}/pdf/download/${actualId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al descargar el comprobante");
      }

      // Obtener el nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `comprobante_${actualId}_${Date.now()}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Crear blob y descargar
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      throw error;
    }
  },

  // Crear sesión de checkout para carrito
  async createCartCheckoutSession(): Promise<CartCheckoutSession> {
    try {
      const response = await apiService.post<CartCheckoutSession>(
        "/stripe/create-cart-checkout-session",
      );

      if (!response.success) {
        throw new Error(
          response.message || "Error creating cart checkout session",
        );
      }

      if (!response.data) {
        throw new Error("No data received from server");
      }

      if (!response.data.sessionId) {
        throw new Error("Invalid response format: missing sessionId");
      }

      return response.data;
    } catch {
      throw error;
    }
  },

  // Obtener estado de sesión de carrito
  async getCartSessionStatus(sessionId: string): Promise<SessionStatus> {
    const response = await apiService.get<SessionStatus>(
      `/stripe/cart-session/${sessionId}`,
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || "Error loading cart session status");
    }
    return response.data;
  },

  // Procesar sesión de carrito
  async processCartSession(sessionId: string): Promise<ProcessResult> {
    const response = await apiService.post<ProcessResult>(
      "/stripe/process-cart-session",
      {
        sessionId,
      },
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Error processing cart session");
    }

    return response.data;
  },
};
