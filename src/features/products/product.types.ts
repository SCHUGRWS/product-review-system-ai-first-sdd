// Shared product contract (plans/02-products/execution.md, Phase 0).

export type ProductCategoryRef = { slug: string; name: string };

export type Product = {
  id: string;
  asin: string;
  title: string;
  /** Canonical https://www.amazon.com.br/dp/<ASIN> */
  url: string;
  /** Always an m.media-amazon.com image */
  imageUrl: string;
  priceCents: number;
  listPriceCents: number | null;
  discountPercent: number | null;
  currency: "BRL";
  /** Amazon rating, 0-5 */
  rating: number | null;
  reviewCount: number | null;
  category: ProductCategoryRef;
  lastSeenAt: Date;
  /**
   * The app's own reviews (not Amazon's). Lists, category grids and search
   * fill it for every product of the page in one query; undefined when it was
   * not loaded (single-product reads, or the stats query failed).
   */
  community?: ProductCommunity;
};

/** Reviews posted in this app for one product */
export type ProductCommunity = {
  count: number;
  /** 1-5, null without reviews */
  average: number | null;
};

export type ProductCategory = ProductCategoryRef & { count: number };

export type ProductPage = {
  items: Product[];
  total: number;
  /** 1-based */
  page: number;
  pageSize: number;
};

export type ProductSort = "discount" | "rating" | "recent";
