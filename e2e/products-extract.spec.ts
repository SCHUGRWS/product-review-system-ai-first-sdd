import path from "node:path";
import { pathToFileURL } from "node:url";
import { rawProductSchema } from "../src/features/products/import.schema";
import { expect, test } from "./base";

// Runs the Browserless extraction (the same file n8n inlines) against a trimmed copy
// of the rendered Amazon deals page, so selector changes are caught without Amazon.
const fixture = pathToFileURL(
  path.join(__dirname, "../n8n/browserless/__fixtures__/deals.html"),
).href;

type Extracted = {
  url: string;
  status: number | null;
  scrolls: number;
  products: Record<string, unknown>[];
};

async function extract(page: import("@playwright/test").Page) {
  const { default: run } = await import("../n8n/browserless/extract-deals.js");
  return (await run({
    page,
    context: { url: fixture, settleMs: 50 },
  })) as Extracted;
}

test("extracts every deal card with the import payload fields", async ({
  page,
}) => {
  const result = await extract(page);

  expect(result.url).toBe(fixture);
  // stops after a few scrolls that bring no new cards
  expect(result.scrolls).toBe(3);
  expect(result.products.map((p) => p.asin)).toEqual([
    "B0GCKFVS2Q",
    "B0F3D25PD3",
    "8551014986",
    "B06X9DFBNK",
    "B0GX2TNR2B",
  ]);

  expect(result.products[0]).toEqual({
    asin: "B0GCKFVS2Q",
    // the element repeats the title; the extraction reads it once
    title: "Lixeira Cozinha 30 Litros com Pedal OU (Cinza)",
    url: expect.stringMatching(
      /^https:\/\/www\.amazon\.com\.br\/.+\/dp\/B0GCKFVS2Q\?ref=/,
    ),
    imageUrl: expect.stringMatching(
      /^https:\/\/m\.media-amazon\.com\/images\/I\/41xYBNh9mTL\./,
    ),
    price: "R$ 119,90",
    listPrice: "R$ 139,90",
    discountPercent: 14,
    rating: "4,0",
    reviewCount: "119 avaliações",
  });
});

test("reads the exact review count and handles cards without reviews", async ({
  page,
}) => {
  const { products } = await extract(page);
  const byAsin = Object.fromEntries(products.map((p) => [p.asin, p]));

  // the visible text is rounded ("(2,2 mil)"); the aria-label is exact
  expect(byAsin.B0F3D25PD3).toMatchObject({
    price: "R$ 198,55",
    reviewCount: "2.164 avaliações",
  });
  expect(byAsin.B0GX2TNR2B).toMatchObject({
    price: "R$ 1.099,98",
    listPrice: "R$ 1.374,98",
    rating: null,
    reviewCount: null,
  });
});

test("every extracted card passes the import schema", async ({ page }) => {
  const { products } = await extract(page);
  const parsed = products.map((p) => rawProductSchema.parse(p));

  expect(parsed[1]).toEqual({
    asin: "B0F3D25PD3",
    title: expect.stringContaining("GameSir Nova 2 Lite"),
    url: "https://www.amazon.com.br/dp/B0F3D25PD3",
    imageUrl:
      "https://m.media-amazon.com/images/I/61yHqDf0SqL._AC_SF226,226_QL85_.jpg",
    priceCents: 19855,
    listPriceCents: 29900,
    discountPercent: 33,
    rating: 4.5,
    reviewCount: 2164,
  });
  expect(parsed[2].asin).toBe("8551014986");
});
