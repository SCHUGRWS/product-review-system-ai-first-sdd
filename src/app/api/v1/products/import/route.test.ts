import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeDb } from "@/server/products/fake-db";

const db = createFakeDb();
vi.mock("@/server/db", () => ({ getDb: () => db.client }));

const { POST } = await import("./route");

const TOKEN = "test-import-token";

function request(
  body: string,
  authorization: string | null = `Bearer ${TOKEN}`,
) {
  return new Request("http://localhost/api/v1/products/import", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(authorization ? { authorization } : {}),
    },
    body,
  });
}

const product = {
  asin: "B0GCKFVS2Q",
  title: "Lixeira Cozinha 30 Litros com Pedal",
  url: "https://www.amazon.com.br/Lixeira/dp/B0GCKFVS2Q?ref=deals",
  imageUrl: "https://m.media-amazon.com/images/I/41xYBNh9mTL._AC_SF226_.jpg",
  price: "R$ 119,90",
  listPrice: "R$ 139,90",
  discountPercent: 14,
  rating: "4,0",
  reviewCount: "(119)",
};

const batch = (products: unknown[]) =>
  JSON.stringify({
    category: { slug: "deals-collection-kitchen", name: "Cozinha" },
    products,
  });

describe("POST /api/v1/products/import", () => {
  beforeEach(() => {
    db.reset();
    vi.stubEnv("PRODUCTS_IMPORT_TOKEN", TOKEN);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns 200 with the summary", async () => {
    const res = await POST(
      request(batch([product, { ...product, asin: "bad" }])),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      received: 2,
      saved: 1,
      skipped: [{ index: 1, reason: "asin: Invalid ASIN" }],
    });
    expect(db.builder.upsert).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["no token", null],
    ["a wrong token", "Bearer nope"],
    ["a non-Bearer header", `Basic ${TOKEN}`],
  ])("returns 401 with %s", async (_label, authorization) => {
    const res = await POST(request(batch([product]), authorization));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Invalid import token" });
    expect(db.from).not.toHaveBeenCalled();
  });

  it("returns 401 when the server has no token configured", async () => {
    vi.stubEnv("PRODUCTS_IMPORT_TOKEN", "");

    const res = await POST(request(batch([product]), "Bearer "));

    expect(res.status).toBe(401);
  });

  it("returns 400 for a body that is not JSON", async () => {
    const res = await POST(request("{nope"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Request body must be valid JSON",
    });
  });

  it("returns 400 without a category", async () => {
    const res = await POST(request(JSON.stringify({ products: [product] })));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid import batch");
    expect(Object.keys(body.fields)).toEqual(["category"]);
    expect(db.from).not.toHaveBeenCalled();
  });

  it("returns 400 for more than 100 products", async () => {
    const res = await POST(
      request(batch(Array.from({ length: 101 }, () => product))),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).fields.products).toEqual([
      "Send at most 100 products per request",
    ]);
    expect(db.from).not.toHaveBeenCalled();
  });

  it("returns 500 when the database fails and logs it", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    db.resolveWith({ data: null, error: { code: "XX000", message: "boom" } });

    const res = await POST(request(batch([product])));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal server error" });
    expect(log).toHaveBeenCalledWith(
      "[api/v1/products/import] unexpected error",
      expect.any(Error),
    );
  });
});
