import { expect, type Page, test } from "./base";
import {
  createAccount,
  findProductCard,
  importOwnProduct,
  signIn,
} from "./helpers";

// Product reviews page and AI summary (specs/product-reviews.md). E2E runs
// without OPENAI_API_KEY, so the summary shows its "unavailable" state once a
// product has 3 reviews. Shared fixture products no other spec reviews:
const NO_REVIEWS = { query: "Torto Arado", title: "Torto Arado" };
const OWN_REVIEW = {
  query: "Pequeno Príncipe",
  title: "O Pequeno Príncipe Capa Dura",
};

const REVIEWS_URL = /\/products\/[A-Za-z0-9_-]{21}$/;
const PAGE_MAX = 1440; // --container-page: 90rem
const TOLERANCE = 2;

// Searches the catalog and follows the reviews link on the product's card
// ("See feedback" while it has no reviews).
async function openReviewsPage(
  page: Page,
  product: { query: string; title: string },
) {
  const card = await findProductCard(page, product);
  await card.getByRole("link", { name: "See feedback" }).click();
  await expect(page).toHaveURL(REVIEWS_URL);
  await expect(
    page.getByRole("heading", { level: 1, name: product.title }),
  ).toBeVisible();
  return new URL(page.url()).pathname.split("/")[3];
}

async function expectFits(page: Page) {
  const box = await page.evaluate(() => {
    const rendered = (el: Element) => el.getBoundingClientRect().width > 0;
    const frames = [...document.querySelectorAll("main [class~='max-w-page']")]
      .filter(rendered)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          left: r.left,
          right: window.innerWidth - r.right,
          width: r.width,
        };
      });
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      frames,
    };
  });
  expect(box.scrollWidth, "page scrolls sideways").toBeLessThanOrEqual(
    box.innerWidth,
  );
  expect(box.frames.length).toBeGreaterThan(0);
  for (const frame of box.frames) {
    expect(Math.abs(frame.left - frame.right)).toBeLessThanOrEqual(TOLERANCE);
    expect(frame.width).toBeLessThanOrEqual(PAGE_MAX + TOLERANCE);
  }
}

test.describe("product reviews", () => {
  // In file order on one worker: the tests create several accounts each
  // (bcrypt on sign-up and sign-in), which floods a dev server when run all
  // at once. A failure does not skip the rest (unlike "serial").
  test.describe.configure({ mode: "default" });

  test("anonymous visit redirects to sign-in", async ({ page }) => {
    await page.goto("/en/products/V1StGXR8_Z5jdHi6B-myT");
    await expect(page).toHaveURL("/en/auth/sign-in");
  });

  test("an unknown product shows the 404 page", async ({ page, request }) => {
    await signIn(page, await createAccount(request));
    for (const path of [
      "/en/products/unknown",
      "/en/products/V1StGXR8_Z5jdHi6B-myT",
    ]) {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { level: 1, name: "Product not found" }),
      ).toBeVisible();
    }
    await page.getByRole("link", { name: "Go to the catalog" }).click();
    await expect(page).toHaveURL("/en/home");
  });

  test("a product without reviews: empty state and the 3-review threshold", async ({
    page,
    request,
  }) => {
    await signIn(page, await createAccount(request));
    const productId = await openReviewsPage(page, NO_REVIEWS);

    const amazon = page.getByRole("link", { name: /Torto Arado/ }).first();
    await expect(amazon).toHaveAttribute("target", "_blank");
    await expect(amazon).toHaveAttribute("rel", "noopener noreferrer nofollow");

    await expect(page.getByTestId("review-count")).toHaveText("0 reviews");
    await expect(page.getByTestId("review-stats")).toContainText(
      "No ratings yet",
    );

    const summary = page.getByTestId("ai-summary");
    await expect(summary).toHaveAttribute("data-state", "too-few");
    await expect(summary).toContainText("The summary appears after 3 reviews");

    const empty = page.getByTestId("reviews-empty");
    await expect(empty).toContainText("No reviews yet");
    await empty.getByRole("link", { name: "Be the first to review" }).click();
    await expect(page).toHaveURL(`/en/products/${productId}/feedback`);
  });

  test("after 3 reviews: slips newest first, numbers, unavailable summary", async ({
    page,
    request,
    playwright,
    baseURL,
  }) => {
    // Its own product: nobody else reviews it, whatever runs in parallel
    const own = await importOwnProduct(request, "Livro Ordem das Resenhas");
    const product = { query: own.word, title: own.title };
    await signIn(page, await createAccount(request));
    const productId = await openReviewsPage(page, product);
    await expect(
      page.getByRole("link", { name: "Give feedback", exact: true }),
    ).toBeVisible();

    // Three other people review it, one after the other, through the REST API
    const reviewers = [
      { firstName: "Alan", lastName: "Turing", rating: 5 },
      { firstName: "Barbara", lastName: "Liskov", rating: 4 },
      { firstName: "Claude", lastName: "Shannon", rating: 2 },
    ];
    const posted: { id: string; createdAt: number; comment: string }[] = [];
    for (const [index, reviewer] of reviewers.entries()) {
      const api = await playwright.request.newContext({ baseURL });
      const account = await createAccount(api, {
        firstName: reviewer.firstName,
        lastName: reviewer.lastName,
      });
      const signedIn = await api.post("/api/v1/sign-in", {
        data: { email: account.email, password: account.password },
      });
      expect(signedIn.status()).toBe(200);
      const comment = `Review number ${index + 1} from ${reviewer.firstName}.`;
      const response = await api.post("/api/v1/feedback", {
        data: { productId, rating: reviewer.rating, comment },
      });
      expect(response.status()).toBe(201);
      const body = (await response.json()) as { id: string; createdAt: string };
      posted.push({
        id: body.id,
        createdAt: Date.parse(body.createdAt),
        comment,
      });
      await api.dispose();
    }

    await page.reload();

    // Newest first by the stored created_at (database clock), ties by id. The
    // stored order is not always the posting order: a machine whose wall clock
    // steps back and forth (seen on WSL2) can stamp a later post earlier.
    const newestFirst = [...posted].sort(
      (a, b) => b.createdAt - a.createdAt || (a.id < b.id ? -1 : 1),
    );
    const slips = page.getByTestId("review-list").getByRole("listitem");
    await expect(slips).toHaveCount(3);
    for (const [index, review] of newestFirst.entries()) {
      await expect(slips.nth(index)).toContainText(review.comment);
    }
    // Each slip prints its own author and stars
    for (const [index, reviewer] of reviewers.entries()) {
      const slip = slips.filter({ hasText: posted[index].comment });
      await expect(slip).toContainText(
        `Review by ${reviewer.firstName} ${reviewer.lastName[0]}.`,
      );
      await expect(
        slip.locator(`[aria-label="${reviewer.rating} out of 5 stars"]`),
      ).toBeVisible();
    }

    // (5 + 4 + 2) / 3 = 3.67
    await expect(page.getByTestId("review-average")).toHaveText("3.7");
    await expect(page.getByTestId("review-count")).toHaveText("3 reviews");
    for (const [stars, label] of [
      [5, "1 review"],
      [4, "1 review"],
      [3, "0 reviews"],
      [2, "1 review"],
      [1, "0 reviews"],
    ] as const) {
      await expect(page.getByTestId(`distribution-${stars}`)).toContainText(
        label,
      );
    }

    // No OpenAI key in E2E: exactly the unavailable state, nothing else
    const summary = page.getByTestId("ai-summary");
    await expect(summary).toHaveAttribute("data-state", "unavailable");
    await expect(summary).toContainText("Summary unavailable right now");
    await expect(summary).not.toContainText("AI summary of");
  });

  test("the reviewer sees that they reviewed the product", async ({
    page,
    request,
  }) => {
    const account = await createAccount(request);
    await signIn(page, account);
    const productId = await openReviewsPage(page, OWN_REVIEW);

    const posted = await page.request.post("/api/v1/feedback", {
      data: { productId, rating: 4, comment: "A slow start, then gripping." },
    });
    expect(posted.status()).toBe(201);
    await page.reload();

    await expect(page.getByTestId("already-reviewed")).toHaveText(
      "You reviewed this product",
    );
    await expect(
      page.getByRole("link", { name: "Give feedback", exact: true }),
    ).toHaveCount(0);
  });

  for (const viewport of [
    { width: 320, height: 720 },
    { width: 3440, height: 1440 },
  ]) {
    test(`fits the screen and stays centered at ${viewport.width}px`, async ({
      page,
      request,
    }) => {
      await page.setViewportSize(viewport);
      // Its own product with one review, so a slip is on the page
      const own = await importOwnProduct(request, "Livro Largura da Tela");
      await signIn(page, await createAccount(request));
      const productId = await openReviewsPage(page, {
        query: own.word,
        title: own.title,
      });
      const posted = await page.request.post("/api/v1/feedback", {
        data: { productId, rating: 3, comment: "Fits every screen I tried." },
      });
      expect(posted.status()).toBe(201);
      await page.reload();
      await expect(
        page.getByTestId("review-list").getByRole("listitem"),
      ).toHaveCount(1);
      await expect(
        page.getByRole("heading", { name: "Community reviews", exact: true }),
      ).toBeVisible();
      await expectFits(page);
    });
  }
});
