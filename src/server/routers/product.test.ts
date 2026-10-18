import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeContext, testUser } from "@/server/test-utils";

const queries = vi.hoisted(() => ({
  searchProducts: vi.fn(),
  getProductById: vi.fn(),
}));
vi.mock("@/server/products/queries", () => ({
  ...queries,
  MIN_SEARCH_LENGTH: 2,
}));

const { createCaller } = await import("./_app");

const signedIn = () => createCaller(makeContext({ user: testUser }));
const anonymous = () => createCaller(makeContext());

const emptyPage = { items: [], total: 0, page: 1, pageSize: 24 };

describe("product router", () => {
  beforeEach(() => {
    queries.searchProducts.mockReset().mockResolvedValue(emptyPage);
    queries.getProductById.mockReset().mockResolvedValue(null);
  });

  it("requires a signed-in user", async () => {
    await expect(anonymous().product.search({ q: "tv" })).rejects.toMatchObject(
      { code: "UNAUTHORIZED" },
    );
    await expect(anonymous().product.byId({ id: "p1" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(queries.searchProducts).not.toHaveBeenCalled();
    expect(queries.getProductById).not.toHaveBeenCalled();
  });

  it("searches with the trimmed text and page", async () => {
    expect(
      await signedIn().product.search({ q: "  smart tv ", page: 2 }),
    ).toEqual(emptyPage);
    expect(queries.searchProducts).toHaveBeenCalledWith("smart tv", {
      page: 2,
    });

    await signedIn().product.search({ q: "tv" });
    expect(queries.searchProducts).toHaveBeenLastCalledWith("tv", { page: 1 });
  });

  it("rejects searches shorter than 2 characters", async () => {
    const error = await signedIn()
      .product.search({ q: " a " })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TRPCError);
    expect(error).toMatchObject({ code: "BAD_REQUEST" });
    expect(queries.searchProducts).not.toHaveBeenCalled();
  });

  it("returns null for an unknown product", async () => {
    expect(await signedIn().product.byId({ id: "unknown" })).toBeNull();
    expect(queries.getProductById).toHaveBeenCalledWith("unknown");
  });
});
