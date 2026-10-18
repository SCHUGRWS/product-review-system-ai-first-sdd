import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/features/products/product.types";
import { createFakeDb } from "@/server/feedback/fake-db";

const db = createFakeDb();
vi.mock("@/server/db", () => ({ getDb: () => ({ from: db.from }) }));

// The catalog belongs to specs/product.md; its lookup is mocked here.
const getProductById = vi.hoisted(() =>
  vi.fn<(id: string) => Promise<Product | null>>(),
);
vi.mock("@/server/products/queries", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getProductById,
}));

// after() only works inside a Next.js request: the scheduled tasks are
// collected here and run by the test that needs them.
const runInBackground = vi.hoisted(() =>
  vi.fn<(label: string, task: () => Promise<unknown>) => void>(),
);
vi.mock("@/server/background", () => ({ runInBackground }));
const refreshSummary = vi.hoisted(() => vi.fn(async () => "generated"));
const listSummaryLocales = vi.hoisted(() =>
  vi.fn(async (): Promise<string[]> => []),
);
vi.mock("@/server/reviews/summary", () => ({
  refreshSummary,
  listSummaryLocales,
}));

const { createCaller } = await import("./_app");
const { makeContext, testUser } = await import("@/server/test-utils");

const signedIn = createCaller(makeContext({ user: testUser }));
const anonymous = createCaller(makeContext());

const product: Product = {
  id: "V1StGXR8_Z5jdHi6B-myT",
  asin: "B0KETTLE01",
  title: "Chaleira Elétrica Inox 1,7L",
  url: "https://www.amazon.com.br/dp/B0KETTLE01",
  imageUrl: "https://m.media-amazon.com/images/I/kettle.jpg",
  priceCents: 9990,
  listPriceCents: 12990,
  discountPercent: 23,
  currency: "BRL",
  rating: 4.5,
  reviewCount: 120,
  category: { slug: "deals-collection-kitchen", name: "Kitchen" },
  lastSeenAt: new Date("2026-10-17T00:00:00Z"),
};

const input = {
  productId: product.id,
  rating: 4,
  comment: "  Boils fast and the lid does not drip. ",
};

const row = {
  id: "fb_1",
  product_name: product.title,
  rating: 4,
  comment: "Boils fast and the lid does not drip.",
  created_at: "2026-10-17T10:00:00+00:00",
};

const reviewProduct = {
  id: product.id,
  title: product.title,
  imageUrl: product.imageUrl,
  url: product.url,
};

beforeEach(() => {
  db.reset();
  vi.restoreAllMocks();
  getProductById.mockReset();
  getProductById.mockResolvedValue(product);
  runInBackground.mockReset();
  refreshSummary.mockClear();
  listSummaryLocales.mockReset().mockResolvedValue([]);
});

describe("feedback.create", () => {
  it("inserts as the signed-in user with the server-side title, ignoring client accountId and productName", async () => {
    db.resolveWith({ data: row, error: null });

    const result = await signedIn.feedback.create({
      ...input,
      accountId: "someone-else",
      productName: "Fake name from the client",
    } as typeof input);

    expect(getProductById).toHaveBeenCalledWith(product.id);
    expect(db.from).toHaveBeenCalledWith("feedbacks");
    expect(db.builder.insert.mock.calls[0][0]).toEqual({
      id: expect.stringMatching(/^[A-Za-z0-9_-]{21}$/),
      account_id: testUser.id,
      product_id: product.id,
      product_name: "Chaleira Elétrica Inox 1,7L",
      rating: 4,
      comment: "Boils fast and the lid does not drip.",
    });
    expect(result).toEqual({
      id: "fb_1",
      product: reviewProduct,
      productName: "Chaleira Elétrica Inox 1,7L",
      rating: 4,
      comment: "Boils fast and the lid does not drip.",
      createdAt: new Date("2026-10-17T10:00:00Z"),
    });
  });

  it("schedules the summary refresh in the author's language after the response, not during it", async () => {
    db.resolveWith({ data: row, error: null });

    await signedIn.feedback.create(input);

    expect(runInBackground).toHaveBeenCalledTimes(1);
    expect(runInBackground).toHaveBeenCalledWith(
      "summary refresh",
      expect.any(Function),
    );
    expect(refreshSummary).not.toHaveBeenCalled();

    await runInBackground.mock.calls[0][1]();
    expect(listSummaryLocales).toHaveBeenCalledWith(product.id);
    expect(refreshSummary).toHaveBeenCalledTimes(1);
    expect(refreshSummary).toHaveBeenCalledWith(product.id, "en");
  });

  it("also refreshes every language that already has a cached summary, once each", async () => {
    db.resolveWith({ data: row, error: null });
    listSummaryLocales.mockResolvedValue(["en", "pt-BR"]);

    await signedIn.feedback.create(input);
    await runInBackground.mock.calls[0][1]();

    expect(refreshSummary.mock.calls).toEqual([
      [product.id, "en"],
      [product.id, "pt-BR"],
    ]);
  });

  it("refreshes in a Portuguese author's language", async () => {
    db.resolveWith({ data: row, error: null });
    const ptAuthor = createCaller(
      makeContext({ user: { ...testUser, locale: "pt-BR" } }),
    );

    await ptAuthor.feedback.create(input);
    await runInBackground.mock.calls[0][1]();

    expect(refreshSummary.mock.calls).toEqual([[product.id, "pt-BR"]]);
  });

  it("schedules no refresh when the feedback is not created", async () => {
    db.resolveWith({
      data: null,
      error: { code: "23505", message: "duplicate key value" },
    });
    await signedIn.feedback.create(input).catch(() => {});
    getProductById.mockResolvedValue(null);
    await signedIn.feedback.create(input).catch(() => {});

    expect(runInBackground).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND for an unknown product without inserting", async () => {
    getProductById.mockResolvedValue(null);

    await expect(signedIn.feedback.create(input)).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Product not found",
    });
    expect(db.from).not.toHaveBeenCalled();
  });

  it("returns CONFLICT when the user already reviewed the product", async () => {
    db.resolveWith({
      data: null,
      error: { code: "23505", message: "duplicate key value" },
    });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(signedIn.feedback.create(input)).rejects.toMatchObject({
      code: "CONFLICT",
      message: "You already reviewed this product",
    });
    expect(log).not.toHaveBeenCalled();
  });

  it("returns UNAUTHORIZED without a user and touches neither products nor feedbacks", async () => {
    await expect(anonymous.feedback.create(input)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Sign in to continue",
    });
    expect(getProductById).not.toHaveBeenCalled();
    expect(db.from).not.toHaveBeenCalled();
  });

  it.each([
    ["rating 6", { ...input, rating: 6 }],
    ["a malformed productId", { ...input, productId: "../etc" }],
    ["a short comment", { ...input, comment: "short" }],
  ])("rejects %s with BAD_REQUEST before any lookup", async (_label, bad) => {
    const error = await signedIn.feedback.create(bad).catch((e) => e);

    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe("BAD_REQUEST");
    expect(getProductById).not.toHaveBeenCalled();
    expect(db.from).not.toHaveBeenCalled();
  });

  it("returns INTERNAL_SERVER_ERROR and logs on database failures", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    db.resolveWith({ data: null, error: { code: "XX000", message: "boom" } });

    await expect(signedIn.feedback.create(input)).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not post the feedback. Please try again later.",
    });
    expect(log).toHaveBeenCalledWith(
      "[feedback.create] failed to insert feedback",
      expect.anything(),
    );
  });

  it("returns INTERNAL_SERVER_ERROR and logs when the product lookup fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    getProductById.mockRejectedValue(new Error("catalog down"));

    await expect(signedIn.feedback.create(input)).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
    expect(log).toHaveBeenCalledWith(
      "[feedback.create] failed to load the product",
      expect.any(Error),
    );
    expect(db.from).not.toHaveBeenCalled();
  });
});

describe("feedback.listMine", () => {
  it("lists the current user's feedback with the product, newest first, 10 by default", async () => {
    db.resolveWith({
      data: [
        {
          ...row,
          product: {
            id: product.id,
            title: product.title,
            image_url: product.imageUrl,
            url: product.url,
          },
        },
        {
          ...row,
          id: "fb_0",
          product_name: "Kettle",
          product: null,
        },
      ],
      error: null,
    });

    const list = await signedIn.feedback.listMine();

    expect(db.builder.eq).toHaveBeenCalledWith("account_id", testUser.id);
    expect(db.builder.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
    expect(db.builder.limit).toHaveBeenCalledWith(10);
    expect(list).toHaveLength(2);
    expect(list[0].product).toEqual(reviewProduct);
    expect(list[1]).toMatchObject({ product: null, productName: "Kettle" });
  });

  it("accepts a limit up to 50 and rejects more", async () => {
    db.resolveWith({ data: [], error: null });

    await signedIn.feedback.listMine({ limit: 50 });
    expect(db.builder.limit).toHaveBeenCalledWith(50);

    await expect(
      signedIn.feedback.listMine({ limit: 51 }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("returns UNAUTHORIZED without a user", async () => {
    await expect(anonymous.feedback.listMine()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(db.from).not.toHaveBeenCalled();
  });

  it("returns INTERNAL_SERVER_ERROR and logs on database failures", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    db.resolveWith({ data: null, error: { code: "XX000", message: "boom" } });

    await expect(signedIn.feedback.listMine()).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
    expect(log).toHaveBeenCalled();
  });
});

describe("feedback.hasReviewed", () => {
  it("checks the signed-in user's feedback for the product", async () => {
    db.resolveWith({ data: [{ id: "fb_1" }], error: null });

    await expect(
      signedIn.feedback.hasReviewed({ productId: product.id }),
    ).resolves.toBe(true);
    expect(db.builder.eq).toHaveBeenCalledWith("account_id", testUser.id);
    expect(db.builder.eq).toHaveBeenCalledWith("product_id", product.id);
  });

  it("is false when the user has not reviewed it", async () => {
    db.resolveWith({ data: [], error: null });

    await expect(
      signedIn.feedback.hasReviewed({ productId: product.id }),
    ).resolves.toBe(false);
  });

  it("rejects a malformed productId and requires a user", async () => {
    await expect(
      signedIn.feedback.hasReviewed({ productId: "x" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      anonymous.feedback.hasReviewed({ productId: product.id }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(db.from).not.toHaveBeenCalled();
  });

  it("returns INTERNAL_SERVER_ERROR and logs on database failures", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    db.resolveWith({ data: null, error: { code: "XX000", message: "boom" } });

    await expect(
      signedIn.feedback.hasReviewed({ productId: product.id }),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(log).toHaveBeenCalled();
  });
});
