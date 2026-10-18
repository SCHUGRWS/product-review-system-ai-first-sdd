// Amazon Brazil deal categories (filter "bubbles" on https://www.amazon.com.br/deals).
// The import stores the full bubble id as the slug ("deals-collection-tvs") and these
// English labels as the name. Unknown slugs keep the name sent by n8n.

export const CATEGORY_PREFIX = "deals-collection-";

/** Slug of the general deals page (no bubble filter) */
export const ALL_DEALS_SLUG = "deals-all";

const LABELS: Record<string, string> = {
  [ALL_DEALS_SLUG]: "More deals",
  automotive: "Automotive",
  baby: "Baby",
  beauty: "Beauty",
  books: "Books",
  computers: "Computers",
  coupons: "Coupons",
  eBooks: "eBooks",
  electronics: "Electronics",
  eletro: "Appliances",
  fashion: "Fashion",
  grocery: "Grocery",
  "health-and-personal-care": "Health and personal care",
  home: "Home",
  kitchen: "Kitchen",
  "lawn-and-garden": "Garden",
  moveis: "Furniture",
  "office-products": "Office",
  "pet-products": "Pet products",
  sports: "Sports",
  tools: "Tools",
  "toys-and-games": "Toys and games",
  tvs: "TVs",
  "video-games": "Video games",
};

/** English label for a category slug, or null when the slug is unknown */
export function categoryLabel(slug: string): string | null {
  const key = slug.startsWith(CATEGORY_PREFIX)
    ? slug.slice(CATEGORY_PREFIX.length)
    : slug;
  return Object.hasOwn(LABELS, key) ? LABELS[key] : null;
}

/** The label when known, otherwise the given fallback (the name sent by n8n) */
export function categoryName(slug: string, fallback: string): string {
  return categoryLabel(slug) ?? fallback;
}
