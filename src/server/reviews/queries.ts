import "server-only";
import {
  type ProductReview,
  type ProductReviewPage,
  type ProductReviewStats,
  REVIEWS_PAGE_SIZE,
  STARS_DESC,
  type StarCount,
} from "@/features/reviews/reviews.schema";
import { shortName } from "@/lib/user-name";
import { getDb } from "@/server/db";

// The app's reviews of one catalog product (specs/product-reviews.md). Legacy
// feedback without a product never matches a product_id, so it is left out.

type ReviewRow = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  /** Embedded through feedbacks.account_id */
  author: { first_name: string; last_name: string } | null;
};

const LIST_COLUMNS =
  "id, rating, comment, created_at, author:accounts (first_name, last_name)";

// Thrown on any database failure; callers log it and show a generic error.
export class ReviewQueryError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ReviewQueryError";
  }
}

function countReviews(productId: string, rating?: StarCount) {
  let query = getDb()
    .from("feedbacks")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  if (rating) query = query.eq("rating", rating);
  return query;
}

/** Count, average and 5..1 distribution (one count per star, index on product_id) */
export async function getProductReviewStats(
  productId: string,
): Promise<ProductReviewStats> {
  const results = await Promise.all(
    STARS_DESC.map((stars) => countReviews(productId, stars)),
  );
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
    StarCount,
    number
  >;
  results.forEach((result, index) => {
    if (result.error) {
      throw new ReviewQueryError("Failed to count reviews", {
        cause: result.error,
      });
    }
    distribution[STARS_DESC[index]] = result.count ?? 0;
  });

  const count = STARS_DESC.reduce((sum, stars) => sum + distribution[stars], 0);
  const total = STARS_DESC.reduce(
    (sum, stars) => sum + stars * distribution[stars],
    0,
  );
  return { count, average: count > 0 ? total / count : null, distribution };
}

function toReview(row: ReviewRow): ProductReview {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    author: row.author
      ? shortName({
          firstName: row.author.first_name,
          lastName: row.author.last_name,
        })
      : null,
    createdAt: new Date(row.created_at),
  };
}

/** Newest first, 20 per page; only the author's short name ("Ada L.") leaves here */
export async function listProductReviews(
  productId: string,
  page = 1,
): Promise<ProductReviewPage> {
  const p = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const pageSize = REVIEWS_PAGE_SIZE;
  const from = (p - 1) * pageSize;

  const { data, count, error } = await getDb()
    .from("feedbacks")
    .select(LIST_COLUMNS, { count: "exact" })
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(from, from + pageSize - 1);

  // PostgREST answers 416 (PGRST103) for a page past the end
  if (error?.code === "PGRST103") {
    const head = await countReviews(productId);
    if (head.error) {
      throw new ReviewQueryError("Failed to count reviews", {
        cause: head.error,
      });
    }
    return { items: [], total: head.count ?? 0, page: p, pageSize };
  }
  if (error || !data) {
    throw new ReviewQueryError("Failed to list reviews", { cause: error });
  }
  return {
    items: (data as unknown as ReviewRow[]).map(toReview),
    total: count ?? data.length,
    page: p,
    pageSize,
  };
}

export type SummaryReviewInput = { rating: number; comment: string };

/** Newest reviews for the AI summary: rating and comment only, no author */
export async function listReviewsForSummary(
  productId: string,
  limit: number,
): Promise<SummaryReviewInput[]> {
  const { data, error } = await getDb()
    .from("feedbacks")
    .select("rating, comment")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) {
    throw new ReviewQueryError("Failed to list reviews for the summary", {
      cause: error,
    });
  }
  return data as SummaryReviewInput[];
}
