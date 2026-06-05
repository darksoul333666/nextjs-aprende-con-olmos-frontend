import { Course } from "../services/courseService";
import { User } from "../services/authService";

type DiscountType = "promotion" | "scholarship" | "none";

interface ScholarshipLike {
  discountPercentage: number;
  isActive?: boolean;
}

interface UserWithScholarship extends User {
  scholarship?: ScholarshipLike | null;
  activeScholarship?: ScholarshipLike | null;
  scholarshipDiscountPercentage?: number;
  scholarshipDiscount?: number;
}

export interface CoursePriceDisplay {
  originalPrice: number;
  finalPrice: number;
  discountPercentage: number;
  discountType: DiscountType;
  promotionDiscount: number;
  scholarshipDiscount: number;
  hasDiscount: boolean;
  discountLabel: string;
}

const clampDiscount = (value: unknown) => {
  const discount = Number(value);

  if (!Number.isFinite(discount) || discount <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, discount));
};

export const getActiveScholarshipDiscount = (user: User | null) => {
  if (!user || user.role !== "estudiante") {
    return 0;
  }

  const student = user as UserWithScholarship;
  const scholarship = student.activeScholarship || student.scholarship;

  if (scholarship && scholarship.isActive !== false) {
    return clampDiscount(scholarship.discountPercentage);
  }

  return clampDiscount(
    student.scholarshipDiscountPercentage ?? student.scholarshipDiscount,
  );
};

export const getActivePromotionDiscount = (
  course: Course,
  now = Date.now(),
) => {
  const promotion = course.activePromotion;

  if (!promotion) {
    return 0;
  }

  const startsAt = promotion.startsAt || promotion.startDate;
  const endsAt = promotion.endsAt || promotion.endDate;
  const startTime = startsAt ? new Date(startsAt).getTime() : NaN;
  const endTime = endsAt ? new Date(endsAt).getTime() : NaN;
  const isActive =
    Number.isFinite(endTime) &&
    now < endTime &&
    (!Number.isFinite(startTime) || now >= startTime);

  return isActive ? clampDiscount(promotion.discountPercentage) : 0;
};

export const getCoursePriceDisplay = (
  course: Course,
  user: User | null,
  now = Date.now(),
): CoursePriceDisplay => {
  const originalPrice = course.price || 0;
  const promotionDiscount = getActivePromotionDiscount(course, now);
  const scholarshipDiscount = getActiveScholarshipDiscount(user);
  const discountPercentage = Math.max(promotionDiscount, scholarshipDiscount);
  const discountType: DiscountType =
    discountPercentage <= 0
      ? "none"
      : scholarshipDiscount >= promotionDiscount && scholarshipDiscount > 0
        ? "scholarship"
        : "promotion";

  const promotionPrice =
    course.activePromotion?.discountedPrice ??
    originalPrice * (1 - promotionDiscount / 100);
  const finalPrice =
    discountType === "promotion"
      ? Math.max(0, promotionPrice)
      : Math.max(0, originalPrice * (1 - discountPercentage / 100));

  return {
    originalPrice,
    finalPrice,
    discountPercentage,
    discountType,
    promotionDiscount,
    scholarshipDiscount,
    hasDiscount: discountPercentage > 0,
    discountLabel:
      discountType === "scholarship"
        ? `Beca ${discountPercentage}% para ti`
        : discountType === "promotion"
          ? `Promoción ${discountPercentage}% OFF`
          : "",
  };
};
