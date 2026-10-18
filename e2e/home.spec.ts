import type { APIRequestContext } from "@playwright/test";
import { expect, type Page, test } from "./base";
import { PAGING_CATEGORY } from "./fixtures/products";
import {
  createAccount,
  findProductCard,
  importOwnProduct,
  signIn,
} from "./helpers";

// Fixture products and the paging category come from e2e/global-setup.ts.
const PAGING_SLUG = PAGING_CATEGORY.slug;

async function signInFresh(page: Page, request: APIRequestContext) {
  await signIn(page, await createAccount(request));
}

test.describe("/home catalog", () => {
  test("shows the discount, rating and category lists", async ({
    page,
    request,
  }) => {
    await signInFresh(page, request);

    await expect(page).toHaveTitle("Products | Product Review System");
    await expect(page.getByLabel("Search products")).toBeVisible();

    for (const name of [
      "Biggest discounts",
      "Top rated",
      "TVs",
      "Video games",
      "Kitchen",
      "Books",
    ]) {
      const row = page.getByRole("region", { name, exact: true });
      await expect(row).toBeVisible();
      await expect(row.getByRole("listitem").first()).toBeVisible();
    }

    // Category rows link to their grid; the cross-category rows do not
    await expect(
      page
        .getByRole("region", { name: "TVs", exact: true })
        .getByRole("link", { name: "See all" }),
    ).toHaveAttribute("href", "/home?category=deals-collection-tvs");
    await expect(
      page
        .getByRole("region", { name: "Biggest discounts" })
        .getByRole("link", { name: "See all" }),
    ).toHaveCount(0);

    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Products" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      nav.getByRole("link", { name: "My page" }),
    ).not.toHaveAttribute("aria-current", "page");
  });

  test('searching "smart tv" shows matching products; clearing shows the lists', async ({
    page,
    request,
  }) => {
    await signInFresh(page, request);

    const search = page.getByLabel("Search products");
    await search.fill("smart tv");
    await search.press("Enter");
    await expect(page).toHaveURL("/home?q=smart+tv");
    await expect(search).toHaveValue("smart tv");

    const count = page.getByText(/^\d+ results? for “smart tv”$/);
    await expect(count).toBeVisible();
    const total = Number((await count.textContent())?.match(/^\d+/)?.[0]);
    expect(total).toBeGreaterThanOrEqual(8);

    const results = page
      .getByRole("list", { name: "Results for “smart tv”" })
      .getByRole("listitem");
    await expect(results).toHaveCount(Math.min(total, 24));
    for (const title of await results
      .locator('a[target="_blank"]')
      .allTextContents()) {
      expect(title).toMatch(/smart tv/i);
    }
    await expect(page.getByRole("region", { name: "Top rated" })).toHaveCount(
      0,
    );

    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(page).toHaveURL("/home");
    await expect(search).toHaveValue("");
    await expect(
      page.getByRole("region", { name: "Biggest discounts" }),
    ).toBeVisible();

    // The search lives in the URL, so the back button restores it
    await page.goBack();
    await expect(page).toHaveURL("/home?q=smart+tv");
    await expect(search).toHaveValue("smart tv");
  });

  test("shows an empty state for a search without matches", async ({
    page,
    request,
  }) => {
    await signInFresh(page, request);
    await page.goto("/home?q=xyzzyplugh");

    await expect(page.getByText("0 results for “xyzzyplugh”")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "No products match “xyzzyplugh”" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Clear search" }).click();
    await expect(page).toHaveURL("/home");
    await expect(page.getByRole("region", { name: "Top rated" })).toBeVisible();
  });

  test('"See all" opens the category grid', async ({ page, request }) => {
    await signInFresh(page, request);

    await page
      .getByRole("region", { name: "TVs", exact: true })
      .getByRole("link", { name: "See all" })
      .click();
    await expect(page).toHaveURL("/home?category=deals-collection-tvs");
    await expect(
      page.getByRole("heading", { level: 2, name: "TVs", exact: true }),
    ).toBeVisible();
    const cards = page
      .getByRole("list", { name: "TVs", exact: true })
      .getByRole("listitem");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(8);

    await page.getByRole("link", { name: "All products" }).click();
    await expect(page).toHaveURL("/home");
  });

  test("paginates a category grid", async ({ page, request }) => {
    await signInFresh(page, request);
    await page.goto(`/home?category=${PAGING_SLUG}`);

    const cards = page
      .getByRole("list", { name: "Paging test" })
      .getByRole("listitem");
    await expect(cards).toHaveCount(24);

    const pagination = page.getByRole("navigation", { name: "Pagination" });
    await expect(
      pagination.getByRole("link", { name: "Page 1" }),
    ).toHaveAttribute("aria-current", "page");
    await pagination.getByRole("link", { name: "Next page" }).click();
    await expect(page).toHaveURL(`/home?category=${PAGING_SLUG}&page=2`);
    await expect(cards).toHaveCount(6);
    await expect(
      pagination.getByRole("link", { name: "Page 2" }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("cards show the app's reviews first and Amazon's rating labelled", async ({
    page,
    request,
    playwright,
    baseURL,
  }) => {
    const own = await importOwnProduct(request, "Garrafa Térmica Inox");
    const product = { query: own.word, title: own.title };
    await signInFresh(page, request);

    let card = await findProductCard(page, product);
    await expect(card.getByTestId("community-reviews")).toHaveText(
      "No reviews yet",
    );
    await expect(card.getByTestId("amazon-rating")).toHaveText(
      "4.6 on Amazon (1,234 reviews)",
    );
    await card.getByRole("link", { name: "See feedback" }).click();
    await expect(page).toHaveURL(/\/products\/[A-Za-z0-9_-]{21}$/);
    const productId = new URL(page.url()).pathname.split("/")[2];

    // Two people review it here: 5 and 2 stars
    for (const rating of [5, 2]) {
      const api = await playwright.request.newContext({ baseURL });
      const account = await createAccount(api);
      const signedIn = await api.post("/api/v1/sign-in", {
        data: { email: account.email, password: account.password },
      });
      expect(signedIn.status()).toBe(200);
      const posted = await api.post("/api/v1/feedback", {
        data: { productId, rating, comment: `Rated it ${rating} out of 5.` },
      });
      expect(posted.status()).toBe(201);
      await api.dispose();
    }

    card = await findProductCard(page, product);
    const community = card.getByTestId("community-reviews");
    await expect(community).toContainText("2 reviews here");
    await expect(community).toContainText("3.5");
    await expect(
      community.getByText("Average rating 3.5 out of 5"),
    ).toBeAttached();
    // Amazon's numbers stay, labelled as Amazon's
    await expect(card.getByTestId("amazon-rating")).toHaveText(
      "4.6 on Amazon (1,234 reviews)",
    );
    await card.getByRole("link", { name: "See 2 reviews" }).click();
    await expect(page).toHaveURL(`/products/${productId}`);
    await expect(page.getByTestId("review-count")).toHaveText("2 reviews");
  });

  test('"Most reviewed here" lists reviewed products, most reviews first', async ({
    page,
    request,
    playwright,
    baseURL,
  }) => {
    // Make sure at least one available product has a review
    const own = await importOwnProduct(request, "Cafeteira Italiana");
    await signInFresh(page, request);
    const card = await findProductCard(page, {
      query: own.word,
      title: own.title,
    });
    await card.getByRole("link", { name: "See feedback" }).click();
    await expect(page).toHaveURL(/\/products\/[A-Za-z0-9_-]{21}$/);
    const productId = new URL(page.url()).pathname.split("/")[2];
    const api = await playwright.request.newContext({ baseURL });
    const account = await createAccount(api);
    await api.post("/api/v1/sign-in", {
      data: { email: account.email, password: account.password },
    });
    const posted = await api.post("/api/v1/feedback", {
      data: { productId, rating: 4, comment: "Makes a strong coffee." },
    });
    expect(posted.status()).toBe(201);
    await api.dispose();

    await page.goto("/home");
    const row = page.getByRole("region", { name: "Most reviewed here" });
    await expect(row).toBeVisible();
    const counts = await row
      .getByTestId("community-reviews")
      .evaluateAll((els) =>
        els.map((el) => Number(el.getAttribute("data-count"))),
      );
    expect(counts.length).toBeGreaterThan(0);
    expect(counts.every((n) => n >= 1)).toBe(true);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
  });

  test("explains an unknown category", async ({ page, request }) => {
    await signInFresh(page, request);
    await page.goto("/home?category=deals-collection-does-not-exist");
    await expect(
      page.getByRole("heading", { name: "We could not find that category" }),
    ).toBeVisible();
  });

  test("product titles open Amazon in a new tab", async ({ page, request }) => {
    await signInFresh(page, request);

    const title = page
      .getByRole("region", { name: "TVs", exact: true })
      .locator('a[target="_blank"]')
      .first();
    await expect(title).toHaveAttribute(
      "href",
      /^https:\/\/www\.amazon\.com\.br\/dp\/[A-Z0-9]{10}$/,
    );
    await expect(title).toHaveAttribute("rel", /\bnoopener\b/);
  });

  test('"Give feedback" opens the product feedback page', async ({
    page,
    request,
  }) => {
    await signInFresh(page, request);

    await page
      .getByRole("region", { name: "Video games", exact: true })
      .getByRole("link", { name: "Give feedback" })
      .first()
      .click();
    await expect(page).toHaveURL(/\/products\/[A-Za-z0-9_-]+\/feedback$/);
  });

  test("redirects anonymous visitors to /auth/sign-in", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL("/auth/sign-in");
    await page.goto("/home?q=smart+tv");
    await expect(page).toHaveURL("/auth/sign-in");
  });

  test("fits a phone screen; rows scroll inside themselves", async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signInFresh(page, request);

    const row = page.getByRole("list", { name: "Biggest discounts" });
    await expect(row.getByRole("listitem").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link", {
        name: "My page",
      }),
    ).toBeVisible();

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);

    // The row itself is wider than the screen and scrolls horizontally
    const scrollable = await row.evaluate(
      (el) => el.scrollWidth > el.clientWidth,
    );
    expect(scrollable).toBe(true);
  });
});
