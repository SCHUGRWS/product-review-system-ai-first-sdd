import "server-only";
import { categoryName } from "@/features/products/categories";
import {
  type ImportBatch,
  type ImportedProduct,
  type ImportSummary,
  rawProductSchema,
} from "@/features/products/import.schema";
import { getDb } from "@/server/db";

// Thrown on any database failure; the route logs it and answers 500.
export class ProductImportError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ProductImportError";
  }
}

function reasonOf(error: {
  issues: { path: PropertyKey[]; message: string }[];
}) {
  const issue = error.issues[0];
  const path = issue.path.map(String).join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}

/**
 * Validates each product on its own (bad items are skipped with their index and
 * reason) and upserts the valid ones on `asin` in one statement. `id` and
 * `first_seen_at` are not sent, so existing rows keep them (database defaults
 * fill them on insert).
 */
export async function importProducts(
  batch: ImportBatch,
): Promise<ImportSummary> {
  const skipped: ImportSummary["skipped"] = [];
  const valid = new Map<string, ImportedProduct>();

  batch.products.forEach((raw, index) => {
    const parsed = rawProductSchema.safeParse(raw);
    if (!parsed.success) {
      skipped.push({ index, reason: reasonOf(parsed.error) });
    } else if (valid.has(parsed.data.asin)) {
      // Postgres rejects an upsert that touches the same row twice
      skipped.push({ index, reason: "asin: Duplicate in this batch" });
    } else {
      valid.set(parsed.data.asin, parsed.data);
    }
  });

  if (valid.size > 0) {
    const lastSeenAt = new Date().toISOString();
    const category = {
      category_slug: batch.category.slug,
      category_name: categoryName(batch.category.slug, batch.category.name),
    };
    const rows = [...valid.values()].map((p) => ({
      asin: p.asin,
      title: p.title,
      url: p.url,
      image_url: p.imageUrl,
      price_cents: p.priceCents,
      list_price_cents: p.listPriceCents,
      discount_percent: p.discountPercent,
      currency: "BRL",
      rating: p.rating,
      review_count: p.reviewCount,
      ...category,
      last_seen_at: lastSeenAt,
    }));

    const { error } = await getDb()
      .from("products")
      .upsert(rows, { onConflict: "asin" });
    if (error) {
      throw new ProductImportError("Failed to save products", {
        cause: error,
      });
    }
  }

  return {
    received: batch.products.length,
    saved: valid.size,
    skipped,
  };
}
