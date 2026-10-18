import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/features/products/product.types";
import { createFakeDb } from "@/server/feedback/fake-db";
import { makeContext, testUser } from "@/server/test-utils";

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

// Session lookup belongs to specs/sign-in.md: a request with a cookie is
// treated as signed in as testUser, one without it as anonymous.
const createContext = vi.hoisted(() => vi.fn());
vi.mock("@/server/context", () => ({ createContext }));

// The summary refresh runs after the response (after()); collected here
const runInBackground = vi.hoisted(() => vi.fn());
vi.mock("@/server/background", () => ({ runInBackground }));

const { POST } = await import("./route");

function request(body: string, { signedIn = true } = {}) {
  return new Request("http://localhost/api/v1/feedback", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(signedIn ? { cookie: "prs_session=token" } : {}),
    },
    body,
  });
}

const product: Product = {
  id: "V1StGXR8_Z5jdHi6B-myT",
  asin: "B0KETTLE01",
  title: "Chaleira Elétrica Inox 1,7L",
  url: "https://www.amazon.com.br/dp/B0KETTLE01",
  imageUrl: "https://m.media-amazon.com/images/I/kettle.jpg",
  priceCents: 9990,
  listPriceCents: null,
  discountPercent: null,
  currency: "BRL",
  rating: null,
  reviewCount: null,
  category: { slug: "deals-collection-kitchen", name: "Kitchen" },
  lastSeenAt: new Date("2026-10-17T00:00:00Z"),
};

const valid = {
  productId: product.id,
  rating: 4,
  comment: "Boils fast and does not drip.",
};

const row = {
  id: "fb_1",
  product_name: product.title,
  rating: 4,
  comment: "Boils fast and does not drip.",
  created_at: "2026-10-17T10:00:00+00:00",
};

describe("POST /api/v1/feedback", () => {
  beforeEach(() => {
    db.reset();
    vi.restoreAllMocks();
    getProductById.mockReset();
    getProductById.mockResolvedValue(product);
    runInBackground.mockReset();
    createContext.mockReset();
    createContext.mockImplementation(async ({ req }: { req: Request }) =>
      makeContext({ user: req.headers.get("cookie") ? testUser : null }),
    );
  });

  it("returns 201 with the created feedback and its product", async () => {
    db.resolveWith({ data: row, error: null });

    const res = await POST(
      request(
        JSON.stringify({
          ...valid,
          accountId: "someone-else",
          productName: "Not the real title",
        }),
      ),
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      id: "fb_1",
      product: {
        id: product.id,
        title: product.title,
        imageUrl: product.imageUrl,
        url: product.url,
      },
      rating: 4,
      comment: "Boils fast and does not drip.",
      createdAt: "2026-10-17T10:00:00.000Z",
    });
    expect(db.builder.insert.mock.calls[0][0]).toMatchObject({
      account_id: testUser.id,
      product_id: product.id,
      product_name: product.title,
    });
    // Same procedure as tRPC: the summary refresh is scheduled after() too
    expect(runInBackground).toHaveBeenCalledWith(
      "summary refresh",
      expect.any(Function),
    );
  });

  it("returns 400 for a body that is not JSON", async () => {
    const res = await POST(request("{nope"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Request body must be valid JSON",
    });
    expect(db.from).not.toHaveBeenCalled();
  });

  it("returns 400 with field errors for invalid fields", async () => {
    const res = await POST(request(JSON.stringify({ rating: 9 })));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Some fields are invalid");
    expect(Object.keys(body.fields).sort()).toEqual([
      "comment",
      "productId",
      "rating",
    ]);
    expect(getProductById).not.toHaveBeenCalled();
    expect(db.from).not.toHaveBeenCalled();
  });

  it("returns 401 without a session cookie", async () => {
    const res = await POST(request(JSON.stringify(valid), { signedIn: false }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Sign in to continue" });
    expect(db.from).not.toHaveBeenCalled();
  });

  it("returns 404 when the product does not exist", async () => {
    getProductById.mockResolvedValue(null);

    const res = await POST(request(JSON.stringify(valid)));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Product not found" });
    expect(db.from).not.toHaveBeenCalled();
  });

  it("returns 409 when the user already reviewed the product", async () => {
    db.resolveWith({
      data: null,
      error: { code: "23505", message: "duplicate key value" },
    });

    const res = await POST(request(JSON.stringify(valid)));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "You already reviewed this product",
    });
  });

  it("returns 500 when the database fails and logs it", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    db.resolveWith({ data: null, error: { code: "XX000", message: "boom" } });

    const res = await POST(request(JSON.stringify(valid)));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: "Could not post the feedback. Please try again later.",
    });
    expect(log).toHaveBeenCalled();
  });

  it("returns 500 on unexpected errors and logs them", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    createContext.mockRejectedValueOnce(new Error("session store down"));

    const res = await POST(request(JSON.stringify(valid)));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal server error" });
    expect(log).toHaveBeenCalledWith(
      "[api/v1/feedback] unexpected error",
      expect.any(Error),
    );
  });
});
