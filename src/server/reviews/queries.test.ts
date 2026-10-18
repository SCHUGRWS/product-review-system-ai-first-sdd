import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeDb } from "@/server/products/fake-db";

const db = createFakeDb();
vi.mock("@/server/db", () => ({ getDb: () => db.client }));

const {
  getProductReviewStats,
  listProductReviews,
  listReviewsForSummary,
  ReviewQueryError,
} = await import("./queries");

const productId = "V1StGXR8_Z5jdHi6B-myT";

const counts = (...perStarDesc: number[]) =>
  perStarDesc.map((count) => ({ data: null, error: null, count }));

beforeEach(() => db.reset());

describe("getProductReviewStats", () => {
  it("returns the count, the average and the 1-5 distribution", async () => {
    // 5, 4, 3, 2, 1 stars
    db.queue(...counts(2, 1, 0, 1, 0));

    const stats = await getProductReviewStats(productId);

    expect(stats.count).toBe(4);
    expect(stats.average).toBeCloseTo((5 * 2 + 4 + 2) / 4);
    expect(stats.distribution).toEqual({ 1: 0, 2: 1, 3: 0, 4: 1, 5: 2 });
    expect(db.from).toHaveBeenCalledWith("feedbacks");
    expect(db.builder.select).toHaveBeenCalledWith("id", {
      count: "exact",
      head: true,
    });
    expect(db.builder.eq).toHaveBeenCalledWith("product_id", productId);
    for (const stars of [1, 2, 3, 4, 5]) {
      expect(db.builder.eq).toHaveBeenCalledWith("rating", stars);
    }
  });

  it("has no average and empty bars without reviews", async () => {
    db.queue(...counts(0, 0, 0, 0, 0));

    expect(await getProductReviewStats(productId)).toEqual({
      count: 0,
      average: null,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  });

  it("throws a ReviewQueryError when a count fails", async () => {
    db.queue(...counts(1, 1), { data: null, error: { message: "boom" } });

    await expect(getProductReviewStats(productId)).rejects.toBeInstanceOf(
      ReviewQueryError,
    );
  });
});

describe("listProductReviews", () => {
  const rows = [
    {
      id: "fb_2",
      rating: 5,
      comment: "Newest one",
      created_at: "2026-10-18T10:00:00+00:00",
      author: { first_name: "Ada", last_name: "Lovelace" },
    },
    {
      id: "fb_1",
      rating: 3,
      comment: "Older one",
      created_at: "2026-10-17T10:00:00+00:00",
      author: { first_name: "Émile", last_name: "  Zola" },
    },
  ];

  it("lists the product's reviews newest first with the author's short name", async () => {
    db.queue({ data: rows, error: null, count: 2 });

    const page = await listProductReviews(productId);

    expect(db.from).toHaveBeenCalledWith("feedbacks");
    expect(db.builder.select).toHaveBeenCalledWith(
      "id, rating, comment, created_at, author:accounts (first_name, last_name)",
      { count: "exact" },
    );
    // Legacy feedback has no product_id, so it never matches
    expect(db.builder.eq).toHaveBeenCalledWith("product_id", productId);
    expect(db.builder.order.mock.calls[0]).toEqual([
      "created_at",
      { ascending: false },
    ]);
    expect(page).toEqual({
      items: [
        {
          id: "fb_2",
          rating: 5,
          comment: "Newest one",
          author: "Ada L.",
          createdAt: new Date("2026-10-18T10:00:00Z"),
        },
        {
          id: "fb_1",
          rating: 3,
          comment: "Older one",
          author: "Émile Z.",
          createdAt: new Date("2026-10-17T10:00:00Z"),
        },
      ],
      total: 2,
      page: 1,
      pageSize: 20,
    });
  });

  it("pages by 20", async () => {
    db.queue({ data: [], error: null, count: 45 });

    const page = await listProductReviews(productId, 3);

    expect(db.builder.range).toHaveBeenCalledWith(40, 59);
    expect(page).toMatchObject({ page: 3, pageSize: 20, total: 45 });
  });

  it("returns an empty page past the end with the real total", async () => {
    db.queue(
      { data: null, error: { code: "PGRST103", message: "range" } },
      { data: null, error: null, count: 4 },
    );

    expect(await listProductReviews(productId, 9)).toEqual({
      items: [],
      total: 4,
      page: 9,
      pageSize: 20,
    });
  });

  it("keeps the review when the author is missing", async () => {
    db.queue({ data: [{ ...rows[0], author: null }], error: null, count: 1 });

    const page = await listProductReviews(productId);

    expect(page.items[0].author).toBeNull();
  });

  it("throws a ReviewQueryError on database failures", async () => {
    db.queue({ data: null, error: { code: "XX000", message: "boom" } });

    await expect(listProductReviews(productId)).rejects.toBeInstanceOf(
      ReviewQueryError,
    );
  });
});

describe("listReviewsForSummary", () => {
  it("selects only rating and comment, newest first, limited", async () => {
    const data = [{ rating: 4, comment: "Fine" }];
    db.queue({ data, error: null });

    expect(await listReviewsForSummary(productId, 50)).toEqual(data);
    expect(db.builder.select).toHaveBeenCalledWith("rating, comment");
    expect(db.builder.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
    expect(db.builder.limit).toHaveBeenCalledWith(50);
  });
});
