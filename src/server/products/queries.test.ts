import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeDb } from "./fake-db";

const db = createFakeDb();
vi.mock("@/server/db", () => ({ getDb: () => db.client }));

const {
  getCommunityStats,
  getProductById,
  listCategories,
  listProducts,
  ProductQueryError,
  searchProducts,
  toProduct,
} = await import("./queries");

const NOW = new Date("2026-10-18T12:00:00Z");

const row = {
  id: "prod_1",
  asin: "B0GCKFVS2Q",
  title: "Lixeira Cozinha 30 Litros",
  url: "https://www.amazon.com.br/dp/B0GCKFVS2Q",
  image_url: "https://m.media-amazon.com/images/I/41xYBNh9mTL.jpg",
  price_cents: 11990,
  list_price_cents: 13990,
  discount_percent: 14,
  currency: "BRL",
  rating: "4.0",
  review_count: 119,
  category_slug: "deals-collection-kitchen",
  category_name: "Cozinha",
  last_seen_at: "2026-10-18T03:00:00+00:00",
};

describe("product queries", () => {
  beforeEach(() => {
    db.reset();
    vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  });
  afterEach(() => vi.useRealTimers());

  it("maps a row to a Product", () => {
    expect(toProduct(row)).toEqual({
      id: "prod_1",
      asin: "B0GCKFVS2Q",
      title: "Lixeira Cozinha 30 Litros",
      url: "https://www.amazon.com.br/dp/B0GCKFVS2Q",
      imageUrl: "https://m.media-amazon.com/images/I/41xYBNh9mTL.jpg",
      priceCents: 11990,
      listPriceCents: 13990,
      discountPercent: 14,
      currency: "BRL",
      rating: 4,
      reviewCount: 119,
      category: { slug: "deals-collection-kitchen", name: "Kitchen" },
      lastSeenAt: new Date("2026-10-18T03:00:00Z"),
    });
    expect(toProduct({ ...row, rating: null }).rating).toBeNull();
  });

  // The rule itself (3 days before the latest import) is SQL, covered by
  // supabase/tests/products_available.test.sql (pnpm db:test).
  it("never filters by the current time: availability comes from the latest import", async () => {
    db.resolveWith({ data: [], error: null, count: 0 });

    await listProducts({ sort: "discount" });
    await searchProducts("lixeira");

    expect(db.builder.gt).not.toHaveBeenCalled();
    expect(db.builder.gte).not.toHaveBeenCalled();
  });

  describe("listCategories", () => {
    it("calls the RPC (no cutoff argument) and labels categories", async () => {
      db.resolveWith({
        data: [
          { slug: "deals-collection-tvs", name: "TVs", count: "12" },
          { slug: "deals-collection-unknown", name: "Outros", count: 3 },
        ],
        error: null,
      });

      expect(await listCategories()).toEqual([
        { slug: "deals-collection-tvs", name: "TVs", count: 12 },
        { slug: "deals-collection-unknown", name: "Outros", count: 3 },
      ]);
      expect(db.rpc).toHaveBeenCalledWith("list_product_categories");
    });

    it("returns no categories for an empty catalog", async () => {
      db.resolveWith({ data: [], error: null });
      expect(await listCategories()).toEqual([]);
    });

    it("throws ProductQueryError on database errors", async () => {
      db.resolveWith({ data: null, error: { message: "boom" } });
      await expect(listCategories()).rejects.toBeInstanceOf(ProductQueryError);
    });
  });

  describe("listProducts", () => {
    it("filters available products of a category, sorted by discount", async () => {
      db.queue(
        { data: [row], error: null, count: 41 },
        {
          data: [{ product_id: "prod_1", review_count: 3, average: "4.33" }],
          error: null,
        },
      );

      const page = await listProducts({
        category: "deals-collection-kitchen",
        sort: "discount",
        page: 3,
      });

      expect(db.from).toHaveBeenCalledWith("available_products");
      expect(db.builder.select).toHaveBeenCalledWith(expect.any(String), {
        count: "exact",
      });
      expect(db.builder.eq).toHaveBeenCalledWith(
        "category_slug",
        "deals-collection-kitchen",
      );
      expect(db.builder.order.mock.calls).toEqual([
        ["discount_percent", { ascending: false, nullsFirst: false }],
        ["review_count", { ascending: false, nullsFirst: false }],
        ["id", { ascending: true }],
      ]);
      expect(db.builder.range).toHaveBeenCalledWith(40, 59);
      expect(page).toEqual({
        items: [{ ...toProduct(row), community: { count: 3, average: 4.33 } }],
        total: 41,
        page: 3,
        pageSize: 20,
      });
    });

    it("sorts by rating with a minimum number of reviews", async () => {
      db.resolveWith({ data: [], error: null, count: 0 });

      await listProducts({ sort: "rating", minReviews: 50 });

      expect(db.builder.gte).toHaveBeenCalledWith("review_count", 50);
      expect(db.builder.eq).not.toHaveBeenCalled();
      expect(db.builder.order.mock.calls[0]).toEqual([
        "rating",
        { ascending: false, nullsFirst: false },
      ]);
      expect(db.builder.range).toHaveBeenCalledWith(0, 19);
    });

    it("sorts by most recently seen", async () => {
      db.resolveWith({ data: [], error: null, count: 0 });

      await listProducts({ sort: "recent" });

      expect(db.builder.order.mock.calls[0]).toEqual([
        "last_seen_at",
        { ascending: false, nullsFirst: undefined },
      ]);
      expect(db.builder.gte).not.toHaveBeenCalled();
    });

    it("caps the page size at 60 and clamps bad pages to 1", async () => {
      db.resolveWith({ data: [], error: null, count: 0 });

      const page = await listProducts({
        sort: "discount",
        page: -2,
        pageSize: 500,
      });

      expect(page).toMatchObject({ page: 1, pageSize: 60 });
      expect(db.builder.range).toHaveBeenCalledWith(0, 59);

      await listProducts({ sort: "discount", page: 2.7, pageSize: 0 });
      expect(db.builder.range).toHaveBeenLastCalledWith(1, 1);
    });

    it("returns an empty page with the total for a page past the end", async () => {
      db.queue(
        { data: null, error: { code: "PGRST103", message: "range" } },
        { data: null, error: null, count: 7 },
      );

      const page = await listProducts({ sort: "discount", page: 9 });

      expect(page).toEqual({ items: [], total: 7, page: 9, pageSize: 20 });
      expect(db.builder.select).toHaveBeenLastCalledWith("id", {
        count: "exact",
        head: true,
      });
      // the count reads the same view of available products
      expect(db.from.mock.calls).toEqual([
        ["available_products"],
        ["available_products"],
      ]);
    });

    it("returns an empty page for an empty catalog", async () => {
      db.resolveWith({ data: [], error: null, count: 0 });

      expect(await listProducts({ sort: "discount" })).toEqual({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
      });
      expect(await searchProducts("lixeira")).toEqual({
        items: [],
        total: 0,
        page: 1,
        pageSize: 24,
      });
    });

    it("throws ProductQueryError on database errors", async () => {
      db.resolveWith({ data: null, error: { code: "XX000", message: "boom" } });
      await expect(listProducts({ sort: "discount" })).rejects.toBeInstanceOf(
        ProductQueryError,
      );
    });
  });

  describe("searchProducts", () => {
    it("uses Portuguese websearch over available products, 24 per page", async () => {
      db.resolveWith({ data: [row], error: null, count: 1 });

      const page = await searchProducts("  lixeira pedal ", { page: 2 });

      expect(db.builder.textSearch).toHaveBeenCalledWith(
        "search",
        "lixeira pedal",
        { type: "websearch", config: "portuguese" },
      );
      expect(db.from).toHaveBeenCalledWith("available_products");
      expect(db.builder.range).toHaveBeenCalledWith(24, 47);
      expect(page).toMatchObject({ total: 1, page: 2, pageSize: 24 });
    });

    it("returns nothing for less than 2 characters without querying", async () => {
      expect(await searchProducts(" a ")).toEqual({
        items: [],
        total: 0,
        page: 1,
        pageSize: 24,
      });
      expect(db.from).not.toHaveBeenCalled();
    });
  });

  describe("the app's review numbers on list pages", () => {
    const rowB = { ...row, id: "prod_2", asin: "B0GCKFVS2R" };
    const rowC = { ...row, id: "prod_3", asin: "B0GCKFVS2S" };

    it("loads counts and averages for the whole page in one call (no query per product)", async () => {
      db.queue(
        { data: [row, rowB, rowC], error: null, count: 3 },
        {
          data: [
            { product_id: "prod_1", review_count: "3", average: "3.67" },
            { product_id: "prod_3", review_count: 1, average: 5 },
          ],
          error: null,
        },
      );

      const page = await listProducts({ sort: "discount" });

      expect(db.rpc).toHaveBeenCalledTimes(1);
      expect(db.rpc).toHaveBeenCalledWith("product_review_stats", {
        ids: ["prod_1", "prod_2", "prod_3"],
      });
      expect(page.items.map((p) => [p.id, p.community])).toEqual([
        ["prod_1", { count: 3, average: 3.67 }],
        // missing from the result: no reviews here
        ["prod_2", { count: 0, average: null }],
        ["prod_3", { count: 1, average: 5 }],
      ]);
    });

    it("search results get the numbers the same way", async () => {
      db.queue(
        { data: [row], error: null, count: 1 },
        { data: [], error: null },
      );

      const page = await searchProducts("lixeira");

      expect(db.rpc).toHaveBeenCalledTimes(1);
      expect(db.rpc).toHaveBeenCalledWith("product_review_stats", {
        ids: ["prod_1"],
      });
      expect(page.items[0].community).toEqual({ count: 0, average: null });
    });

    it("skips the call for an empty page", async () => {
      db.resolveWith({ data: [], error: null, count: 0 });

      await listProducts({ sort: "discount" });
      await searchProducts("lixeira");

      expect(db.rpc).not.toHaveBeenCalled();
      expect(await getCommunityStats([])).toEqual(new Map());
      expect(db.rpc).not.toHaveBeenCalled();
    });

    it("still lists the products, without the numbers, when the stats call fails", async () => {
      const log = vi.spyOn(console, "error").mockImplementation(() => {});
      db.queue(
        { data: [row], error: null, count: 1 },
        { data: null, error: { message: "boom" } },
      );

      const page = await listProducts({ sort: "discount" });

      expect(page.items).toEqual([toProduct(row)]);
      expect(page.items[0].community).toBeUndefined();
      expect(log).toHaveBeenCalledOnce();
      log.mockRestore();
    });

    it("getCommunityStats throws ProductQueryError on database errors", async () => {
      db.resolveWith({ data: null, error: { message: "boom" } });
      await expect(getCommunityStats(["prod_1"])).rejects.toBeInstanceOf(
        ProductQueryError,
      );
    });
  });

  describe("getProductById", () => {
    it("returns any product by id, without the availability filter", async () => {
      db.resolveWith({ data: row, error: null });

      expect(await getProductById("prod_1")).toEqual(toProduct(row));
      expect(db.from).toHaveBeenCalledWith("products");
      expect(db.from).not.toHaveBeenCalledWith("available_products");
      expect(db.builder.eq).toHaveBeenCalledWith("id", "prod_1");
    });

    it("returns null for an unknown id and throws on errors", async () => {
      db.resolveWith({ data: null, error: null });
      expect(await getProductById("nope")).toBeNull();

      db.resolveWith({ data: null, error: { message: "boom" } });
      await expect(getProductById("prod_1")).rejects.toBeInstanceOf(
        ProductQueryError,
      );
    });
  });
});
