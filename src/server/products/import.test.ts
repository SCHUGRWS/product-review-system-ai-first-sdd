import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeDb } from "./fake-db";

const db = createFakeDb();
vi.mock("@/server/db", () => ({ getDb: () => db.client }));

const { importProducts, ProductImportError } = await import("./import");

const raw = (asin: string, overrides: Record<string, unknown> = {}) => ({
  asin,
  title: `Produto ${asin}`,
  url: `https://www.amazon.com.br/produto/dp/${asin}?ref=deals`,
  imageUrl: "https://m.media-amazon.com/images/I/41GPp28c-bL._AC_SF226_.jpg",
  price: "R$ 336,90",
  listPrice: "R$ 453,90",
  discountPercent: 26,
  rating: "3,9",
  reviewCount: "(48)",
  ...overrides,
});

const category = { slug: "deals-collection-kitchen", name: "Cozinha" };

describe("importProducts", () => {
  beforeEach(() => db.reset());

  it("upserts valid items on asin with last_seen_at, without id or first_seen_at", async () => {
    const before = Date.now();

    const summary = await importProducts({
      category,
      products: [raw("B000000001"), raw("B000000002")],
    });

    expect(summary).toEqual({ received: 2, saved: 2, skipped: [] });
    expect(db.from).toHaveBeenCalledWith("products");
    expect(db.builder.upsert).toHaveBeenCalledTimes(1);
    const [rows, options] = db.builder.upsert.mock.calls[0] as [
      Record<string, unknown>[],
      unknown,
    ];
    expect(options).toEqual({ onConflict: "asin" });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      asin: "B000000001",
      title: "Produto B000000001",
      url: "https://www.amazon.com.br/dp/B000000001",
      image_url:
        "https://m.media-amazon.com/images/I/41GPp28c-bL._AC_SF226_.jpg",
      price_cents: 33690,
      list_price_cents: 45390,
      discount_percent: 26,
      currency: "BRL",
      rating: 3.9,
      review_count: 48,
      category_slug: "deals-collection-kitchen",
      // English label instead of the name sent by n8n
      category_name: "Kitchen",
      last_seen_at: expect.any(String),
    });
    expect(rows[0]).not.toHaveProperty("id");
    expect(rows[0]).not.toHaveProperty("first_seen_at");
    expect(Date.parse(rows[0].last_seen_at as string)).toBeGreaterThanOrEqual(
      before,
    );
  });

  it("keeps the name sent by n8n for unknown categories", async () => {
    await importProducts({
      category: { slug: "deals-collection-new-thing", name: "Novidade" },
      products: [raw("B000000001")],
    });
    const [rows] = db.builder.upsert.mock.calls[0] as [
      Record<string, unknown>[],
    ];
    expect(rows[0].category_name).toBe("Novidade");
  });

  it("skips invalid items with index and reason and saves the rest", async () => {
    const summary = await importProducts({
      category,
      products: [
        raw("B000000001"),
        raw("nope"),
        "not an object",
        raw("B000000003", { imageUrl: "https://example.com/images/a.jpg" }),
        raw("B000000004", { price: "" }),
        raw("B000000001"),
        raw("B000000005"),
      ],
    });

    expect(summary).toEqual({
      received: 7,
      saved: 2,
      skipped: [
        { index: 1, reason: "asin: Invalid ASIN" },
        { index: 2, reason: expect.any(String) },
        {
          index: 3,
          reason: "Image must be an https://m.media-amazon.com/images/ URL",
        },
        { index: 4, reason: "Missing price" },
        { index: 5, reason: "asin: Duplicate in this batch" },
      ],
    });
    const [rows] = db.builder.upsert.mock.calls[0] as [{ asin: string }[]];
    expect(rows.map((r) => r.asin)).toEqual(["B000000001", "B000000005"]);
  });

  it("does not call the database when no item is valid", async () => {
    const summary = await importProducts({
      category,
      products: [raw("bad"), { title: "x" }],
    });

    expect(summary.saved).toBe(0);
    expect(summary.skipped).toHaveLength(2);
    expect(db.from).not.toHaveBeenCalled();
  });

  it("throws ProductImportError when the database fails", async () => {
    db.resolveWith({ data: null, error: { code: "XX000", message: "boom" } });

    await expect(
      importProducts({ category, products: [raw("B000000001")] }),
    ).rejects.toBeInstanceOf(ProductImportError);
  });
});
