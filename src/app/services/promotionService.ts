import { apiService } from "./api";

export interface PromotionCourse {
  _id: string;
  title: string;
}

export interface Promotion {
  _id: string;
  courseId: string | PromotionCourse;
  discountPercentage: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreatePromotionRequest {
  courseId: string;
  discountPercentage: number;
  startsAt: string;
  endsAt: string;
}

class PromotionService {
  private normalizePromotion(data: Record<string, unknown>): Promotion {
    return {
      _id: (data._id || data.id) as string,
      courseId: data.courseId as string | PromotionCourse,
      discountPercentage: (data.discountPercentage as number) || 0,
      startsAt: (data.startsAt || data.startDate) as string,
      endsAt: (data.endsAt || data.endDate) as string,
      isActive: data.isActive !== false,
      createdAt: (data.createdAt as string) || "",
    };
  }

  async getPromotions(): Promise<Promotion[]> {
    const response = await apiService.get<{
      promotions?: Record<string, unknown>[];
    }>("/promotions");

    const promotions = response.data?.promotions || [];
    return promotions.map((promotion) => this.normalizePromotion(promotion));
  }

  async createPromotion(data: CreatePromotionRequest): Promise<Promotion> {
    const response = await apiService.post<{
      promotion?: Record<string, unknown>;
    }>("/promotions", data);

    const promotion = response.data?.promotion;
    if (!promotion) {
      throw new Error(response.message || "No se pudo crear la promoción");
    }

    return this.normalizePromotion(promotion);
  }
}

export const promotionService = new PromotionService();
