import { type APIRequestContext, expect, type Page } from "@playwright/test";
import { customAlphabet, nanoid } from "nanoid";
import {
  type ImportBatch,
  OWN_PRODUCTS_CATEGORY,
  productBatches,
} from "./fixtures/products";

// Every page lives under /<locale>/ (specs/i18n.md). Specs run in English
// unless they say otherwise; path("/home") -> "/en/home".
export type E2ELocale = "en" | "pt-BR";
export const E2E_LOCALE: E2ELocale = "en";

export function path(pathname: string, locale: E2ELocale = E2E_LOCALE) {
  return pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
}

export type TestAccount = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

// Creates a fresh account through the REST API, with a unique email per call.
export async function createAccount(
  request: APIRequestContext,
  overrides: Partial<TestAccount> = {},
): Promise<TestAccount> {
  const account = {
    firstName: "Ada",
    lastName: "Lovelace",
    email: `e2e-${nanoid(10).toLowerCase()}@example.com`,
    password: "supersecret",
    ...overrides,
  };
  const response = await request.post("/api/v1/sign-up", {
    data: { ...account, confirmPassword: account.password },
  });
  expect(response.status()).toBe(201);
  return account;
}

// Signs in through the UI and waits for the home page.
export async function signIn(page: Page, account: TestAccount) {
  await page.goto(path("/auth/sign-in"));
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(path("/home"));
}

// Imports products through the n8n import endpoint (idempotent upsert by ASIN).
// The shared fixtures are imported once by e2e/global-setup.ts; specs only
// call this for products of their own (unique ASINs).
export async function seedProducts(
  request: APIRequestContext,
  batches: ImportBatch[] = productBatches,
) {
  const token = process.env.PRODUCTS_IMPORT_TOKEN;
  if (!token) throw new Error("PRODUCTS_IMPORT_TOKEN must be set for E2E");
  for (const batch of batches) {
    const response = await request.post("/api/v1/products/import", {
      headers: { Authorization: `Bearer ${token}` },
      data: batch,
    });
    expect(response.status()).toBe(200);
  }
}

const letters = customAlphabet("abcdefghijklmnopqrstuvwxyz", 10);
const asinSuffix = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 6);

export type OwnProduct = { asin: string; title: string; word: string };

// Imports one product only the calling test uses: a unique "E2EO" ASIN (removed
// by the global teardown) and a made-up word in the title, so a search for the
// word finds exactly this product, whatever else the catalog holds.
export async function importOwnProduct(
  request: APIRequestContext,
  label: string,
): Promise<OwnProduct> {
  const word = `Zq${letters()}`;
  const asin = `E2EO${asinSuffix()}`;
  const title = `${label} ${word}`;
  await seedProducts(request, [
    {
      category: OWN_PRODUCTS_CATEGORY,
      products: [
        {
          asin,
          title,
          url: `https://www.amazon.com.br/produto/dp/${asin}?ref=e2e`,
          imageUrl:
            "https://m.media-amazon.com/images/I/41Y0BD0IUXL._AC_SF226,226_QL85_.jpg",
          price: "R$ 59,90",
          listPrice: "R$ 79,90",
          discountPercent: 25,
          rating: "4,6",
          reviewCount: "(1.234)",
        },
      ],
    },
  ]);
  return { asin, title, word };
}

// The catalog card of one product, found by its exact title among the search
// results (the local catalog may hold real products matching the same words).
export async function findProductCard(
  page: Page,
  product: { query: string; title: string },
) {
  await page.goto(`${path("/home")}?q=${encodeURIComponent(product.query)}`);
  const card = page.getByRole("article").filter({
    has: page.getByRole("heading", { level: 3, name: product.title }),
  });
  await expect(card).toHaveCount(1);
  return card;
}
