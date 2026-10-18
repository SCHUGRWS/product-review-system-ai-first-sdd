import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/features/products/product.types";
import type { ProductReviewPage } from "@/features/reviews/reviews.schema";

const getProductById = vi.hoisted(() =>
  vi.fn<(id: string) => Promise<Product | null>>(),
);
vi.mock("@/server/products/queries", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getProductById,
}));

const listProductReviews = vi.hoisted(() =>
  vi.fn<(productId: string, page?: number) => Promise<ProductReviewPage>>(),
);
vi.mock("@/server/reviews/queries", () => ({ listProductReviews }));

const { createCaller } = await import("./_app");
const { makeContext, testUser } = await import("@/server/test-utils");

const signedIn = createCaller(makeContext({ user: testUser }));
const anonymous = createCaller(makeContext());

const productId = "V1StGXR8_Z5jdHi6B-myT";
const product = { id: productId, title: "Chaleira" } as Product;

const reviewsPage: ProductReviewPage = {
  items: [
    {
      id: "fb_1",
      rating: 5,
      comment: "Boils fast and quietly.",
      author: "Ada L.",
      createdAt: new Date("2026-10-18T10:00:00Z"),
    },
  ],
  total: 21,
  page: 2,
  pageSize: 20,
};

beforeEach(() => {
  vi.restoreAllMocks();
  getProductById.mockReset();
  getProductById.mockResolvedValue(product);
  listProductReviews.mockReset();
  listProductReviews.mockResolvedValue(reviewsPage);
});

describe("review.listByProduct", () => {
  it("returns UNAUTHORIZED without a user and touches nothing", async () => {
    await expect(
      anonymous.review.listByProduct({ productId }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(getProductById).not.toHaveBeenCalled();
    expect(listProductReviews).not.toHaveBeenCalled();
  });

  it("passes the page through and returns the paginated reviews", async () => {
    const result = await signedIn.review.listByProduct({ productId, page: 2 });

    expect(listProductReviews).toHaveBeenCalledWith(productId, 2);
    expect(result).toEqual(reviewsPage);
  });

  it("defaults to the first page", async () => {
    await signedIn.review.listByProduct({ productId });
    expect(listProductReviews).toHaveBeenCalledWith(productId, 1);
  });

  it("returns NOT_FOUND for an unknown product", async () => {
    getProductById.mockResolvedValue(null);

    await expect(
      signedIn.review.listByProduct({ productId }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Product not found",
    });
    expect(listProductReviews).not.toHaveBeenCalled();
  });

  it.each([
    ["a malformed productId", { productId: "../etc" }],
    ["page 0", { productId, page: 0 }],
  ])("rejects %s with BAD_REQUEST", async (_label, input) => {
    await expect(signedIn.review.listByProduct(input)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(getProductById).not.toHaveBeenCalled();
  });

  it("returns INTERNAL_SERVER_ERROR and logs when the list fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    listProductReviews.mockRejectedValue(new Error("boom"));

    await expect(
      signedIn.review.listByProduct({ productId }),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(log).toHaveBeenCalledWith(
      "[review.listByProduct] failed to list reviews",
      expect.any(Error),
    );
  });
});
