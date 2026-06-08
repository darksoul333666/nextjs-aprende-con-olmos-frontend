import { apiService } from "./api";

export interface GiftCardCourse {
  _id: string;
  title: string;
}

export interface GiftCard {
  _id: string;
  name: string;
  code: string;
  courseId: string | GiftCardCourse;
  maxRedemptions: number;
  redeemedCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateGiftCardRequest {
  name: string;
  courseId: string;
  maxRedemptions: number;
  code: string;
}

class GiftCardService {
  private normalizeGiftCard(data: Record<string, unknown>): GiftCard {
    return {
      _id: (data._id || data.id) as string,
      name: data.name as string,
      code: data.code as string,
      courseId: data.courseId as string | GiftCardCourse,
      maxRedemptions: (data.maxRedemptions as number) || 0,
      redeemedCount: (data.redeemedCount as number) || 0,
      isActive: data.isActive !== false,
      createdAt: (data.createdAt as string) || "",
    };
  }

  async getGiftCards(): Promise<GiftCard[]> {
    const response = await apiService.get<{
      giftCards?: Record<string, unknown>[];
      cards?: Record<string, unknown>[];
    }>("/promotions/gift-cards");

    const giftCards = response.data?.giftCards || response.data?.cards || [];
    return giftCards.map((giftCard) => this.normalizeGiftCard(giftCard));
  }

  async createGiftCard(data: CreateGiftCardRequest): Promise<GiftCard> {
    const response = await apiService.post<{
      giftCard?: Record<string, unknown>;
      card?: Record<string, unknown>;
    }>("/promotions/gift-cards", data);

    const giftCard = response.data?.giftCard || response.data?.card;
    if (!giftCard) {
      throw new Error(response.message || "No se pudo crear la tarjeta");
    }

    return this.normalizeGiftCard(giftCard);
  }
}

export const giftCardService = new GiftCardService();
