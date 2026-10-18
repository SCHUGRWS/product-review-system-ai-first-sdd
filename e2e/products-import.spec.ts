import { customAlphabet } from "nanoid";
import { expect, test } from "./base";
import { type ImportBatch, OWN_PRODUCTS_CATEGORY } from "./fixtures/products";
import { createAccount, seedProducts, signIn } from "./helpers";

// POST /api/v1/products/import, the endpoint the n8n workflow calls (specs/product.md).
const letters = customAlphabet("abcdefghijklmnopqrstuvwxyz", 10);
const asinSuffix = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 6);

function uniqueBatch(price: string): {
  batch: ImportBatch;
  title: string;
  word: string;
} {
  // A made-up word, so the search finds only this product
  const word = `Zq${letters()}`;
  const title = `Fone Bluetooth ${word} com cancelamento de ruído`;
  const asin = `E2EI${asinSuffix()}`;
  return {
    word,
    title,
    batch: {
      // Not a real catalog category, so no other list or count changes
      category: OWN_PRODUCTS_CATEGORY,
      products: [
        {
          asin,
          title,
          url: `https://www.amazon.com.br/fone/dp/${asin}?ref=e2e`,
          imageUrl:
            "https://m.media-amazon.com/images/I/41GPp28c-bL._AC_SF226,226_QL85_.jpg",
          price,
          listPrice: "R$ 399,90",
          discountPercent: null,
          rating: "4,4",
          reviewCount: "(1.234)",
        },
      ],
    },
  };
}

test.describe("products import", () => {
  test("imports a batch, shows it in search, and updates it without duplicates", async ({
    page,
    request,
  }) => {
    const { batch, title, word } = uniqueBatch("R$ 299,90");
    await seedProducts(request, [batch]);

    const account = await createAccount(request);
    await signIn(page, account);
    await page.goto(`/en/home?q=${word}`);
    const cards = page.getByRole("article").filter({ hasText: title });
    await expect(cards).toHaveCount(1);
    await expect(cards).toContainText("R$ 299,90");

    // Same ASIN, new price: updated in place
    batch.products[0].price = "R$ 279,90";
    await seedProducts(request, [batch]);

    await page.goto(`/en/home?q=${word}`);
    await expect(cards).toHaveCount(1);
    await expect(cards).toContainText("R$ 279,90");
  });

  test("returns the summary with skipped items", async ({ request }) => {
    const { batch } = uniqueBatch("R$ 99,90");
    batch.products.push({ ...batch.products[0], asin: "bad", title: "x" });

    const response = await request.post("/api/v1/products/import", {
      headers: { Authorization: `Bearer ${process.env.PRODUCTS_IMPORT_TOKEN}` },
      data: batch,
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({
      received: 2,
      saved: 1,
      skipped: [{ index: 1, reason: "asin: Invalid ASIN" }],
    });
  });

  test("rejects a wrong or missing token with 401", async ({ request }) => {
    const { batch } = uniqueBatch("R$ 99,90");

    const wrong = await request.post("/api/v1/products/import", {
      headers: { Authorization: "Bearer not-the-token" },
      data: batch,
    });
    expect(wrong.status()).toBe(401);

    const missing = await request.post("/api/v1/products/import", {
      data: batch,
    });
    expect(missing.status()).toBe(401);
  });
});
