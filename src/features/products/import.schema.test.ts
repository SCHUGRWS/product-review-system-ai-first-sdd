import { describe, expect, it } from "vitest";
import {
  canonicalProductUrl,
  cleanTitle,
  importBatchSchema,
  parsePrice,
  parseRating,
  parseReviewCount,
  rawProductSchema,
} from "./import.schema";

const raw = {
  asin: "B0GCKFVS2Q",
  title: "Lixeira Cozinha 30 Litros com Pedal OU (Cinza)",
  url: "https://www.amazon.com.br/Lixeira-Cozinha/dp/B0GCKFVS2Q?ref=dlx_deals&pf_rd_r=XYZ",
  imageUrl:
    "https://m.media-amazon.com/images/I/41xYBNh9mTL._AC_SF226,226_QL85_.jpg?aicid=discounts-widgets-horizonte",
  price: "R$ 119,90",
  listPrice: "R$ 139,90",
  discountPercent: 14,
  rating: "4,0",
  reviewCount: "(119)",
};

function issueOf(input: unknown) {
  const result = rawProductSchema.safeParse(input);
  expect(result.success).toBe(false);
  return result.error?.issues[0].message;
}

describe("parsePrice", () => {
  it.each([
    ["R$ 1.999,94", 199994],
    ["R$1.999,94", 199994],
    ["1.999,94", 199994],
    ["R$ 49,90", 4990],
    ["R$ 1.999,94", 199994],
    ["R$ 12.345.678,05", 1234567805],
    ["Preço da Oferta: R$ 119,90", 11990],
    ["R$ 1.999", 199900],
    ["R$ 10,5", 1050],
    [49.9, 4990],
  ])("%j → %d cents", (input, cents) => {
    expect(parsePrice(input)).toBe(cents);
  });

  it.each([
    [""],
    [null],
    [undefined],
    ["Ver opções"],
    [Number.NaN],
    [-1],
  ])("%j → null", (input) => {
    expect(parsePrice(input)).toBeNull();
  });
});

describe("parseRating and parseReviewCount", () => {
  it("reads Brazilian decimals", () => {
    expect(parseRating("4,5")).toBe(4.5);
    expect(parseRating("4.5")).toBe(4.5);
    expect(parseRating(4)).toBe(4);
    expect(parseRating("")).toBeNull();
    expect(parseRating(null)).toBeNull();
  });

  it.each([
    ["(1.234)", 1234],
    ["(628)", 628],
    ["2.164 avaliações", 2164],
    ["(2,2 mil)", 2200],
    ["(14 mil)", 14000],
    [87, 87],
  ])("%j → %d", (input, count) => {
    expect(parseReviewCount(input)).toBe(count);
  });

  it("is null for empty values", () => {
    expect(parseReviewCount("")).toBeNull();
    expect(parseReviewCount(null)).toBeNull();
    expect(parseReviewCount(1.5)).toBeNull();
  });
});

describe("cleanTitle", () => {
  it("drops a title rendered twice and collapses whitespace", () => {
    expect(cleanTitle("Smart TV 50 polSmart TV 50 pol")).toBe(
      "Smart TV 50 pol",
    );
    expect(cleanTitle("  Kit   2 Cristaleiras ")).toBe("Kit 2 Cristaleiras");
    expect(cleanTitle("abab cd")).toBe("abab cd");
  });
});

describe("rawProductSchema", () => {
  it("normalizes a product as read from the page", () => {
    expect(rawProductSchema.parse(raw)).toEqual({
      asin: "B0GCKFVS2Q",
      title: "Lixeira Cozinha 30 Litros com Pedal OU (Cinza)",
      url: "https://www.amazon.com.br/dp/B0GCKFVS2Q",
      imageUrl:
        "https://m.media-amazon.com/images/I/41xYBNh9mTL._AC_SF226,226_QL85_.jpg",
      priceCents: 11990,
      listPriceCents: 13990,
      discountPercent: 14,
      rating: 4,
      reviewCount: 119,
    });
  });

  it("builds the canonical URL from the ASIN, dropping slug and tracking", () => {
    expect(canonicalProductUrl("B0GCKFVS2Q")).toBe(
      "https://www.amazon.com.br/dp/B0GCKFVS2Q",
    );
    expect(rawProductSchema.parse({ ...raw, url: undefined }).url).toBe(
      "https://www.amazon.com.br/dp/B0GCKFVS2Q",
    );
  });

  it("accepts numeric book ASINs and uppercases ASINs", () => {
    expect(rawProductSchema.parse({ ...raw, asin: "8551014986" }).asin).toBe(
      "8551014986",
    );
    expect(rawProductSchema.parse({ ...raw, asin: "b0gckfvs2q" }).asin).toBe(
      "B0GCKFVS2Q",
    );
  });

  it.each([
    ["B0GCKFVS2"],
    ["B0GCKFVS2QX"],
    ["B0GCK-VS2Q"],
    [""],
  ])("rejects the ASIN %j", (asin) => {
    expect(issueOf({ ...raw, asin })).toBe("Invalid ASIN");
  });

  it.each([
    ["https://evil.example.com/images/I/a.jpg"],
    ["http://m.media-amazon.com/images/I/a.jpg"],
    ["https://m.media-amazon.com.evil.com/images/I/a.jpg"],
    ["https://m.media-amazon.com/other/a.jpg"],
    ["not a url"],
  ])("rejects the image %j", (imageUrl) => {
    expect(issueOf({ ...raw, imageUrl })).toBe(
      "Image must be an https://m.media-amazon.com/images/ URL",
    );
  });

  it("rejects product links outside www.amazon.com.br", () => {
    expect(issueOf({ ...raw, url: "https://amazon.evil.com/dp/X" })).toBe(
      "Product URL must be on www.amazon.com.br",
    );
  });

  it("rejects items without a price or title", () => {
    expect(issueOf({ ...raw, price: null })).toBe("Missing price");
    expect(issueOf({ ...raw, price: "R$ 0,00" })).toBe("Missing price");
    expect(issueOf({ ...raw, title: "   " })).toBe("Missing title");
  });

  it("computes the discount when it is missing", () => {
    const product = rawProductSchema.parse({
      ...raw,
      price: "R$ 1.999,94",
      listPrice: "R$ 2.699,90",
      discountPercent: null,
    });
    expect(product.discountPercent).toBe(26);
  });

  it("accepts a discount like '25% off' and leaves it null without a list price", () => {
    expect(
      rawProductSchema.parse({ ...raw, discountPercent: "25% off" })
        .discountPercent,
    ).toBe(25);
    const noList = rawProductSchema.parse({
      ...raw,
      listPrice: null,
      discountPercent: null,
    });
    expect(noList.listPriceCents).toBeNull();
    expect(noList.discountPercent).toBeNull();
  });

  it("ignores a list price that is not above the deal price", () => {
    const product = rawProductSchema.parse({
      ...raw,
      listPrice: "R$ 119,90",
      discountPercent: null,
    });
    expect(product.listPriceCents).toBeNull();
    expect(product.discountPercent).toBeNull();
  });

  it("rejects ratings and discounts out of range", () => {
    expect(issueOf({ ...raw, rating: "5,5" })).toBe(
      "Rating must be between 0 and 5",
    );
    expect(issueOf({ ...raw, discountPercent: 120 })).toBe(
      "Discount must be between 0 and 100",
    );
  });

  it("keeps rating and review count null when the card has none", () => {
    const product = rawProductSchema.parse({
      ...raw,
      rating: null,
      reviewCount: null,
    });
    expect(product.rating).toBeNull();
    expect(product.reviewCount).toBeNull();
  });
});

describe("importBatchSchema", () => {
  const category = { slug: "deals-collection-tvs", name: "TVs" };

  it("accepts 1 to 100 products of any shape (validated one by one later)", () => {
    expect(
      importBatchSchema.safeParse({ category, products: [raw, { nope: 1 }] })
        .success,
    ).toBe(true);
    expect(
      importBatchSchema.safeParse({
        category,
        products: Array.from({ length: 100 }, () => raw),
      }).success,
    ).toBe(true);
  });

  it("rejects more than 100 products, no products, or no category", () => {
    expect(
      importBatchSchema.safeParse({
        category,
        products: Array.from({ length: 101 }, () => raw),
      }).success,
    ).toBe(false);
    expect(
      importBatchSchema.safeParse({ category, products: [] }).success,
    ).toBe(false);
    expect(importBatchSchema.safeParse({ products: [raw] }).success).toBe(
      false,
    );
    expect(
      importBatchSchema.safeParse({
        category: { slug: "tvs; drop table", name: "TVs" },
        products: [raw],
      }).success,
    ).toBe(false);
  });
});
