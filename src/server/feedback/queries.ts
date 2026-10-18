import "server-only";
import { nanoid } from "nanoid";
import type {
  CreateFeedbackData,
  Feedback,
  FeedbackProduct,
} from "@/features/feedback/feedback.schema";
import { getDb } from "@/server/db";

type ProductRow = {
  id: string;
  title: string;
  image_url: string;
  url: string;
};

export type FeedbackRow = {
  id: string;
  product_name: string;
  rating: number;
  comment: string;
  created_at: string;
  /** Embedded through the product_id foreign key; null for legacy rows */
  product?: ProductRow | null;
};

const COLUMNS = "id, product_name, rating, comment, created_at";
const COLUMNS_WITH_PRODUCT = `${COLUMNS}, product:products (id, title, image_url, url)`;

// Postgres unique_violation: feedbacks_account_product_key
const UNIQUE_VIOLATION = "23505";

// Thrown on any database failure; callers log it and answer with a generic error.
export class FeedbackQueryError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "FeedbackQueryError";
  }
}

// The user already has a feedback for this product (one per user per product).
export class FeedbackAlreadyExistsError extends Error {
  constructor(options?: { cause?: unknown }) {
    super("Feedback already exists for this product", options);
    this.name = "FeedbackAlreadyExistsError";
  }
}

export function toFeedback(row: FeedbackRow): Feedback {
  const product = row.product ?? null;
  return {
    id: row.id,
    product: product
      ? {
          id: product.id,
          title: product.title,
          imageUrl: product.image_url,
          url: product.url,
        }
      : null,
    productName: row.product_name,
    rating: row.rating,
    comment: row.comment,
    createdAt: new Date(row.created_at),
  };
}

// The author is always the caller's account and the product name is the
// catalog title at this moment (a snapshot); the id is generated here.
export async function insertFeedback(
  accountId: string,
  product: FeedbackProduct,
  data: CreateFeedbackData,
): Promise<Feedback> {
  const { data: row, error } = await getDb()
    .from("feedbacks")
    .insert({
      id: nanoid(),
      account_id: accountId,
      product_id: product.id,
      product_name: product.title,
      rating: data.rating,
      comment: data.comment,
    })
    .select(COLUMNS)
    .single();

  if (error?.code === UNIQUE_VIOLATION) {
    throw new FeedbackAlreadyExistsError({ cause: error });
  }
  if (error || !row) {
    throw new FeedbackQueryError("Failed to insert feedback", { cause: error });
  }
  // Only the review fields, even when a full catalog Product is passed in
  const { id, title, imageUrl, url } = product;
  return {
    ...toFeedback(row as FeedbackRow),
    product: { id, title, imageUrl, url },
  };
}

// Newest first, with the product; uses the (account_id, created_at desc) index.
export async function listFeedbackByAccount(
  accountId: string,
  limit: number,
): Promise<Feedback[]> {
  const { data, error } = await getDb()
    .from("feedbacks")
    .select(COLUMNS_WITH_PRODUCT)
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    throw new FeedbackQueryError("Failed to list feedback", { cause: error });
  }
  return (data as unknown as FeedbackRow[]).map(toFeedback);
}

// Whether the account already reviewed the product (uses the unique index).
export async function hasFeedbackForProduct(
  accountId: string,
  productId: string,
): Promise<boolean> {
  const { data, error } = await getDb()
    .from("feedbacks")
    .select("id")
    .eq("account_id", accountId)
    .eq("product_id", productId)
    .limit(1);

  if (error || !data) {
    throw new FeedbackQueryError("Failed to check feedback", { cause: error });
  }
  return data.length > 0;
}
