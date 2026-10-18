import { z } from "zod";
import { productIdSchema } from "@/features/feedback/feedback.schema";

// Product reviews page (specs/product-reviews.md).

export const REVIEWS_PAGE_SIZE = 20;
const MAX_PAGE = 10_000;

export const listByProductSchema = z.object({
  productId: productIdSchema,
  page: z.number().int().min(1).max(MAX_PAGE).default(1),
});

export type StarCount = 1 | 2 | 3 | 4 | 5;
export const STARS_DESC: StarCount[] = [5, 4, 3, 2, 1];

export type ProductReviewStats = {
  count: number;
  /** null when there are no reviews */
  average: number | null;
  /** Number of reviews per star rating */
  distribution: Record<StarCount, number>;
};

export type ProductReview = {
  id: string;
  rating: number;
  comment: string;
  /** "Ada L."; null if the author's account is gone */
  author: string | null;
  createdAt: Date;
};

export type ProductReviewPage = {
  items: ProductReview[];
  total: number;
  /** 1-based */
  page: number;
  pageSize: number;
};

// "?page=3" on /products/<id>; anything malformed is page 1.
export function parseReviewsPage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw.trim())) return 1;
  return Math.min(Math.max(Number.parseInt(raw, 10), 1), MAX_PAGE);
}
