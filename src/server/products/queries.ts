import "server-only";
import { categoryName } from "@/features/products/categories";
import type {
  Product,
  ProductCategory,
  ProductCommunity,
  ProductPage,
  ProductSort,
} from "@/features/products/product.types";
import { getDb } from "@/server/db";

// Lists, search and category counts only return available products: those
// seen within AVAILABLE_DAYS before the latest import (the most recent
// last_seen_at in the table). The rule lives in SQL, in the available_products
// view and list_product_categories() (migration 20261018160000), so a catalog
// imported by hand does not empty itself days after the last run.
// getProductById returns any product, so older feedback pages keep working.

export const AVAILABLE_DAYS = 3;
/** View with the available products only */
export const AVAILABLE_PRODUCTS = "available_products";
export const DEFAULT_PAGE_SIZE = 20;
export const SEARCH_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 60;
export const MIN_SEARCH_LENGTH = 2;

export type ProductRow = {
  id: string;
  asin: string;
  title: string;
  url: string;
  image_url: string;
  price_cents: number;
  list_price_cents: number | null;
  discount_percent: number | null;
  currency: string;
  rating: number | string | null;
  review_count: number | null;
  category_slug: string;
  category_name: string;
  last_seen_at: string;
};

const COLUMNS =
  "id, asin, title, url, image_url, price_cents, list_price_cents, discount_percent, currency, rating, review_count, category_slug, category_name, last_seen_at";

// Thrown on any database failure; callers log it and answer with a generic error.
export class ProductQueryError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ProductQueryError";
  }
}

export function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    asin: row.asin,
    title: row.title,
    url: row.url,
    imageUrl: row.image_url,
    priceCents: row.price_cents,
    listPriceCents: row.list_price_cents,
    discountPercent: row.discount_percent,
    currency: "BRL",
    // numeric(2,1) may come back as a string depending on the driver
    rating: row.rating === null ? null : Number(row.rating),
    reviewCount: row.review_count,
    category: {
      slug: row.category_slug,
      name: categoryName(row.category_slug, row.category_name),
    },
    lastSeenAt: new Date(row.last_seen_at),
  };
}

function pagination(page: number | undefined, pageSize: number | undefined) {
  const p = Number.isFinite(page) ? Math.max(1, Math.floor(page as number)) : 1;
  const size = Number.isFinite(pageSize)
    ? Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(pageSize as number)))
    : DEFAULT_PAGE_SIZE;
  return { page: p, pageSize: size, from: (p - 1) * size, to: p * size - 1 };
}

type Filters = { category?: string; minReviews?: number; q?: string };

// Available products matching the filters; shared by the page query and the
// fallback count query.
function filteredQuery(
  columns: string,
  options: { count: "exact"; head?: boolean },
  filters: Filters,
) {
  let q = getDb().from(AVAILABLE_PRODUCTS).select(columns, options);
  if (filters.category) q = q.eq("category_slug", filters.category);
  if (filters.minReviews && filters.minReviews > 0) {
    q = q.gte("review_count", filters.minReviews);
  }
  if (filters.q) {
    q = q.textSearch("search", filters.q, {
      type: "websearch",
      config: "portuguese",
    });
  }
  return q;
}

type Sort = ProductSort | "popular";

const ORDER: Record<Sort, [column: string, nullsFirst?: boolean][]> = {
  discount: [
    ["discount_percent", false],
    ["review_count", false],
  ],
  rating: [
    ["rating", false],
    ["review_count", false],
  ],
  recent: [["last_seen_at"]],
  popular: [
    ["review_count", false],
    ["rating", false],
  ],
};

async function fetchPage(
  filters: Filters,
  sort: Sort,
  page: number | undefined,
  pageSize: number | undefined,
): Promise<ProductPage> {
  const range = pagination(page, pageSize);
  let query = filteredQuery(COLUMNS, { count: "exact" }, filters);
  for (const [column, nullsFirst] of ORDER[sort]) {
    query = query.order(column, { ascending: false, nullsFirst });
  }
  // Stable order across pages
  const { data, count, error } = await query
    .order("id", { ascending: true })
    .range(range.from, range.to);

  const result = { page: range.page, pageSize: range.pageSize };

  // PostgREST answers 416 (PGRST103) for a page past the end
  if (error?.code === "PGRST103") {
    const head = await filteredQuery(
      "id",
      { count: "exact", head: true },
      filters,
    );
    if (head.error) {
      throw new ProductQueryError("Failed to count products", {
        cause: head.error,
      });
    }
    return { ...result, items: [], total: head.count ?? 0 };
  }
  if (error || !data) {
    throw new ProductQueryError("Failed to list products", { cause: error });
  }
  return {
    ...result,
    items: await withCommunity(
      (data as unknown as ProductRow[]).map(toProduct),
    ),
    total: count ?? data.length,
  };
}

type ReviewStatsRow = {
  product_id: string;
  review_count: number | string;
  average: number | string | null;
};

/**
 * The app's review count and average for each of the ids, in one call
 * (product_review_stats, migration 20261018165000). Ids without reviews are
 * missing from the map.
 */
export async function getCommunityStats(
  ids: string[],
): Promise<Map<string, ProductCommunity>> {
  const stats = new Map<string, ProductCommunity>();
  if (ids.length === 0) return stats;
  const { data, error } = await getDb().rpc("product_review_stats", { ids });
  if (error || !data) {
    throw new ProductQueryError("Failed to load review stats", {
      cause: error,
    });
  }
  for (const row of data as ReviewStatsRow[]) {
    const count = Number(row.review_count);
    stats.set(row.product_id, {
      count,
      // numeric comes back as a string depending on the driver
      average: count > 0 && row.average !== null ? Number(row.average) : null,
    });
  }
  return stats;
}

/**
 * Adds `community` to every product of one page with a single stats query (no
 * query per card). If that query fails the products are returned without it,
 * so the cards still show and only leave the app's numbers out.
 */
export async function withCommunity(products: Product[]): Promise<Product[]> {
  if (products.length === 0) return products;
  let stats: Map<string, ProductCommunity>;
  try {
    stats = await getCommunityStats(products.map((p) => p.id));
  } catch (error) {
    console.error("[products] failed to load the app's review stats", error);
    return products;
  }
  return products.map((product) => ({
    ...product,
    community: stats.get(product.id) ?? { count: 0, average: null },
  }));
}

/** Categories with available products, the largest first */
export async function listCategories(): Promise<ProductCategory[]> {
  const { data, error } = await getDb().rpc("list_product_categories");
  if (error || !data) {
    throw new ProductQueryError("Failed to list categories", { cause: error });
  }
  return (data as { slug: string; name: string; count: number | string }[]).map(
    (row) => ({
      slug: row.slug,
      name: categoryName(row.slug, row.name),
      count: Number(row.count),
    }),
  );
}

export async function listProducts(opts: {
  category?: string;
  sort: ProductSort;
  minReviews?: number;
  /** 1-based */
  page?: number;
  /** Default 20, max 60 */
  pageSize?: number;
}): Promise<ProductPage> {
  return fetchPage(
    { category: opts.category, minReviews: opts.minReviews },
    opts.sort,
    opts.page,
    opts.pageSize,
  );
}

/** Full-text search (Portuguese) over titles; most reviewed first */
export async function searchProducts(
  q: string,
  opts: { page?: number; pageSize?: number } = {},
): Promise<ProductPage> {
  const text = q.trim();
  if (text.length < MIN_SEARCH_LENGTH) {
    const { page, pageSize } = pagination(
      opts.page,
      opts.pageSize ?? SEARCH_PAGE_SIZE,
    );
    return { items: [], total: 0, page, pageSize };
  }
  return fetchPage(
    { q: text },
    "popular",
    opts.page,
    opts.pageSize ?? SEARCH_PAGE_SIZE,
  );
}

/** Any product, available or not (feedback pages of old products keep working) */
export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await getDb()
    .from("products")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new ProductQueryError("Failed to get product", { cause: error });
  }
  return data ? toProduct(data as ProductRow) : null;
}
