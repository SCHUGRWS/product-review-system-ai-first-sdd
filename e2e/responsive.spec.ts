import { expect, type Page, test } from "./base";
import { createAccount, signIn } from "./helpers";

// Layout guard: no sideways page scroll from a 320px phone to a 3440px
// ultra-wide, and on wide screens the page frame stays centered and capped
// (--container-page and --container-split in globals.css).
const PAGE_MAX = 1440; // --container-page: 90rem
const SPLIT_MAX = 1280; // --container-split: 80rem
const TOLERANCE = 2;

const WIDTHS = [
  { width: 320, height: 720 },
  { width: 1280, height: 900 },
  { width: 3440, height: 1440 },
];

const PUBLIC_PAGES = [
  "/en",
  "/en/auth/sign-in",
  "/en/auth/sign-up",
  "/en/auth/sign-up/success",
];

async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth, "page scrolls sideways").toBeLessThanOrEqual(innerWidth);
}

// Split pages: the content column and the slip panel form one frame with the
// same gap on both sides; the paper and cobalt fields bleed to the edges.
async function expectSplitFrameCentered(page: Page) {
  const frame = await page.evaluate(() => {
    // Skip pages Next.js keeps mounted but hidden (<Activity>)
    const rendered = (el: Element) => el.getBoundingClientRect().width > 0;
    const content = [...document.querySelectorAll("main")].find(
      rendered,
    )?.parentElement;
    const panel = [...document.querySelectorAll("[data-split-panel]")].find(
      rendered,
    );
    if (!content || !panel) return null;
    const c = content.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    return {
      left: c.left,
      right: window.innerWidth - p.right,
      width: p.right - c.left,
    };
  });
  expect(frame, "split layout frame").not.toBeNull();
  if (!frame) return;
  expect(Math.abs(frame.left - frame.right)).toBeLessThanOrEqual(TOLERANCE);
  expect(frame.width).toBeLessThanOrEqual(SPLIT_MAX + TOLERANCE);
}

// Header bar, bands and lists: every page container is centered and capped,
// and the main heading starts inside it (not anchored to the screen edge).
async function expectPageFrameCentered(page: Page) {
  const frames = await page.evaluate(() => {
    const vw = window.innerWidth;
    // Next.js keeps visited pages mounted but hidden (<Activity>), so only
    // boxes that render count; the h1 is taken from the visible page too.
    const rendered = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const boxes = [
      ...document.querySelectorAll(
        "header [class~='max-w-page'], main [class~='max-w-page'], main [class~='lg:max-w-page']",
      ),
      ...document.querySelectorAll("main ul[aria-label]"),
    ]
      .filter(rendered)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          name: `${el.tagName.toLowerCase()} ${el.getAttribute("aria-label") ?? ""}`,
          left: r.left,
          right: vw - r.right,
          width: r.width,
        };
      });
    const h1 = [...document.querySelectorAll("main h1")]
      .find(rendered)
      ?.getBoundingClientRect();
    return { vw, boxes, h1Left: h1?.left ?? null };
  });

  expect(frames.boxes.length).toBeGreaterThan(0);
  for (const box of frames.boxes) {
    expect(
      Math.abs(box.left - box.right),
      `${box.name} is off-center (left ${box.left}, right ${box.right})`,
    ).toBeLessThanOrEqual(TOLERANCE);
    expect(box.width, `${box.name} is wider than the page`).toBeLessThanOrEqual(
      PAGE_MAX + TOLERANCE,
    );
  }
  expect(frames.h1Left).not.toBeNull();
  expect(frames.h1Left ?? 0).toBeGreaterThanOrEqual(
    (frames.vw - PAGE_MAX) / 2 - TOLERANCE,
  );
}

for (const size of WIDTHS) {
  test.describe(`at ${size.width}px`, () => {
    test.use({ viewport: size });

    test("public pages fit the screen and stay centered", async ({ page }) => {
      for (const path of PUBLIC_PAGES) {
        await test.step(path, async () => {
          await page.goto(path, { waitUntil: "domcontentloaded" });
          await expect(page.locator("main h1")).toBeVisible();
          await expectNoHorizontalScroll(page);
          if (size.width >= 1024) await expectSplitFrameCentered(page);
        });
      }
    });

    test("signed-in pages fit the screen and stay centered", async ({
      page,
      request,
    }) => {
      // Seven pages behind one sign-in, each streaming many product images
      test.slow();
      await signIn(page, await createAccount(request));
      const feedbackHref = await page
        .getByRole("link", { name: "Give feedback" })
        .first()
        .getAttribute("href");
      expect(feedbackHref).toBeTruthy();
      const reviewsHref = await page
        // "See feedback", or "See 3 reviews" once the product has reviews
        .getByRole("link", { name: /^See (feedback|[\d,]+ reviews?)$/ })
        .first()
        .getAttribute("href");
      expect(reviewsHref).toBeTruthy();

      const framed = [
        { path: "/en/home", ready: "Biggest discounts" },
        { path: "/en/home?q=smart", ready: "Search results" },
        { path: "/en/home?category=deals-collection-tvs", ready: "TVs" },
        { path: "/en/me", ready: "Your recent feedback" },
        { path: reviewsHref ?? "/en/home", ready: "Community reviews" },
      ];
      for (const { path, ready } of framed) {
        await test.step(path, async () => {
          await page.goto(path, { waitUntil: "domcontentloaded" });
          await expect(
            page.getByRole("heading", { name: ready, exact: true }),
          ).toBeVisible();
          await expectNoHorizontalScroll(page);
          if (size.width >= 1920) await expectPageFrameCentered(page);
        });
      }

      await test.step("feedback form", async () => {
        await page.goto(feedbackHref ?? "/en/home", {
          waitUntil: "domcontentloaded",
        });
        await expect(
          page.getByRole("heading", { name: "Write feedback" }),
        ).toBeVisible();
        await expectNoHorizontalScroll(page);
        if (size.width >= 1024) await expectSplitFrameCentered(page);
      });
    });
  });
}
