import { z } from "zod";

// Validation and normalization of POST /api/v1/products/import (specs/product.md).
// n8n sends the strings as read from the Amazon deals page ("R$ 1.999,94", "4,5",
// "(1.234)"); this file turns them into the values stored in `products`.

export const MAX_BATCH_SIZE = 100;
export const ASIN_PATTERN = /^[A-Z0-9]{10}$/;

const IMAGE_HOST = "m.media-amazon.com";
const PRODUCT_HOST = "www.amazon.com.br";

/** Canonical product URL, without slug or tracking parameters */
export function canonicalProductUrl(asin: string) {
  return `https://${PRODUCT_HOST}/dp/${asin}`;
}

// Whitespace, including the non-breaking spaces Intl and Amazon put after "R$"
const SPACES = /[\s  ]+/g;

/**
 * "R$ 1.999,94" → 199994 (integer cents). Also accepts "R$1.999,94", "1.999,94",
 * "Preço da Oferta: R$ 49,90" and numbers in reais. Null when there is no price.
 */
export function parsePrice(input: unknown): number | null {
  if (typeof input === "number") {
    return Number.isFinite(input) && input >= 0
      ? Math.round(input * 100)
      : null;
  }
  if (typeof input !== "string") return null;
  const match = input
    .replace(SPACES, "")
    .match(/(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?/);
  if (!match) return null;
  const reais = Number(match[1].replaceAll(".", ""));
  const cents = Number((match[2] ?? "0").padEnd(2, "0"));
  return reais * 100 + cents;
}

/** "4,5" → 4.5; numbers pass through. Null when empty */
export function parseRating(input: unknown): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (typeof input !== "string") return null;
  const match = input.replace(SPACES, "").match(/\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(",", ".")) : null;
}

/** "(1.234)" → 1234; "(2,2 mil)" → 2200; "2.164 avaliações" → 2164 */
export function parseReviewCount(input: unknown): number | null {
  if (typeof input === "number") {
    return Number.isInteger(input) && input >= 0 ? input : null;
  }
  if (typeof input !== "string") return null;
  const text = input.replace(SPACES, " ").trim().toLowerCase();
  const thousands = text.match(/(\d+(?:,\d+)?)\s*mil\b/);
  if (thousands) {
    return Math.round(Number(thousands[1].replace(",", ".")) * 1000);
  }
  const match = text.match(/\d{1,3}(?:\.\d{3})+|\d+/);
  return match ? Number(match[0].replaceAll(".", "")) : null;
}

/** "25% off" or 25 → 25. Null when empty */
function parsePercent(input: unknown): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (typeof input !== "string") return null;
  const match = input.match(/\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(",", ".")) : null;
}

/** Amazon sometimes renders the title twice in the same element */
export function cleanTitle(input: string) {
  const title = input.replace(SPACES, " ").trim();
  const half = title.length / 2;
  if (Number.isInteger(half) && half > 0) {
    const first = title.slice(0, half);
    if (first === title.slice(half)) return first.trim();
  }
  return title;
}

const optionalRaw = z.union([z.string(), z.number()]).nullish();

const rawFields = z.object({
  asin: z.string().trim().toUpperCase().regex(ASIN_PATTERN, "Invalid ASIN"),
  title: z
    .string()
    .transform(cleanTitle)
    .pipe(z.string().min(1, "Missing title").max(500, "Title too long")),
  url: z.string().nullish(),
  imageUrl: z.string(),
  price: optionalRaw,
  listPrice: optionalRaw,
  discountPercent: optionalRaw,
  rating: optionalRaw,
  reviewCount: optionalRaw,
});

export type ImportedProduct = {
  asin: string;
  title: string;
  url: string;
  imageUrl: string;
  priceCents: number;
  listPriceCents: number | null;
  discountPercent: number | null;
  rating: number | null;
  reviewCount: number | null;
};

/** One product as sent by n8n, normalized to the stored values */
export const rawProductSchema = rawFields.transform(
  (raw, ctx): ImportedProduct => {
    const fail = (message: string) => {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    };

    if (raw.url) {
      const url = URL.parse(raw.url);
      if (!url || url.hostname !== PRODUCT_HOST) {
        return fail("Product URL must be on www.amazon.com.br");
      }
    }

    const image = URL.parse(raw.imageUrl);
    if (
      !image ||
      image.protocol !== "https:" ||
      image.hostname !== IMAGE_HOST ||
      !image.pathname.startsWith("/images/")
    ) {
      return fail("Image must be an https://m.media-amazon.com/images/ URL");
    }

    const priceCents = parsePrice(raw.price);
    if (priceCents === null || priceCents <= 0) return fail("Missing price");

    // A "list price" at or below the deal price is not a discount
    const listCents = parsePrice(raw.listPrice);
    const listPriceCents =
      listCents !== null && listCents > priceCents ? listCents : null;

    let discountPercent = parsePercent(raw.discountPercent);
    if (discountPercent === null && listPriceCents !== null) {
      discountPercent = ((listPriceCents - priceCents) / listPriceCents) * 100;
    }
    if (discountPercent !== null) {
      discountPercent = Math.round(discountPercent);
      if (discountPercent < 0 || discountPercent > 100) {
        return fail("Discount must be between 0 and 100");
      }
    }

    let rating = parseRating(raw.rating);
    if (rating !== null) {
      if (rating < 0 || rating > 5) {
        return fail("Rating must be between 0 and 5");
      }
      rating = Math.round(rating * 10) / 10;
    }

    return {
      asin: raw.asin,
      title: raw.title,
      url: canonicalProductUrl(raw.asin),
      imageUrl: `https://${IMAGE_HOST}${image.pathname}`,
      priceCents,
      listPriceCents,
      discountPercent,
      rating,
      reviewCount: parseReviewCount(raw.reviewCount),
    };
  },
);

/**
 * The request body. Products are validated one by one in `importProducts`, so a
 * bad item is skipped instead of failing the whole batch.
 */
export const importBatchSchema = z.object({
  category: z.object({
    slug: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9-]{1,80}$/, "Invalid category slug"),
    name: z.string().trim().min(1).max(80),
  }),
  products: z
    .array(z.unknown())
    .min(1, "Send at least one product")
    .max(MAX_BATCH_SIZE, `Send at most ${MAX_BATCH_SIZE} products per request`),
});

export type ImportBatch = z.infer<typeof importBatchSchema>;

export type ImportSummary = {
  received: number;
  saved: number;
  skipped: { index: number; reason: string }[];
};
