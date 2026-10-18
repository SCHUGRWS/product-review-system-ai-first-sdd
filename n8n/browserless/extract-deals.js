// Browserless /function code: renders one Amazon Brazil deals page and extracts
// the deal cards. Single source of truth for the scraper selectors: the n8n
// workflow inlines this file (n8n/build-workflow.mjs) and the tests run it
// against a saved page (n8n/browserless/__fixtures__/deals.html).
//
// context: { url, maxScrolls?, settleMs?, maxProducts?, timeoutMs? }
// returns (sent as JSON by Browserless): { url, status, scrolls, products }
// Each product has the raw strings of the import payload (specs/product.md):
// { asin, title, url, imageUrl, price, listPrice, discountPercent, rating, reviewCount }

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

const CARD = '[data-testid="product-card"]';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Runs inside the page: every selector the scraper depends on is here.
function extractCards(cardSelector) {
  const text = (el) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
  const money = (el) => {
    const match = text(el).match(/R\$\s?[\d.]+(?:,\d{2})?/);
    return match ? match[0].replace(/\s/g, " ") : null;
  };
  // Amazon may render the title twice in the same element ("AbcAbc")
  const dedupe = (value) => {
    const half = value.length / 2;
    return Number.isInteger(half) && value.slice(0, half) === value.slice(half)
      ? value.slice(0, half).trim()
      : value;
  };

  return Array.from(document.querySelectorAll(cardSelector)).map((card) => {
    const asin = card.getAttribute("data-asin") ?? "";
    const titleEl = card.querySelector(`[id="title-${asin}"]`);
    const img = card.querySelector("img");
    const link = card.querySelector('a[data-testid="product-card-link"]');
    const prices = card.querySelector('[data-testid="price-section"]');
    const badge = text(card.querySelector('[data-component="dui-badge"]'));
    const discount = badge.match(/(\d{1,3})\s?%/);
    const reviews = card.querySelector('[data-testid="review-count-link"]');

    const title =
      text(titleEl?.querySelector(".a-truncate-full")) ||
      dedupe(text(titleEl)) ||
      (img?.getAttribute("alt") ?? "").trim();

    return {
      asin,
      title,
      url: link ? link.href : null,
      imageUrl: img ? img.src : null,
      price: money(
        prices?.querySelector(".a-price:not(.a-text-price) .a-offscreen") ??
          prices?.querySelector(".a-price:not(.a-text-price)"),
      ),
      listPrice: money(
        prices?.querySelector(".a-text-price .a-offscreen") ??
          prices?.querySelector('[data-a-strike="true"]'),
      ),
      discountPercent: discount ? Number(discount[1]) : null,
      rating: text(card.querySelector('[data-testid="review-value"]')) || null,
      // aria-label has the exact count ("2.164 avaliações"); the text is rounded ("(2,2 mil)")
      reviewCount:
        (reviews?.getAttribute("aria-label") ?? "").trim() ||
        text(reviews) ||
        null,
    };
  });
}

export default async function ({ page, context = {} }) {
  const {
    url = "https://www.amazon.com.br/deals",
    maxScrolls = 15,
    settleMs = 1200,
    maxProducts = 150,
    timeoutMs = 45000,
  } = context;

  // Puppeteer (Browserless) and Playwright (tests) name these differently
  if (typeof page.setUserAgent === "function") {
    await page.setUserAgent(USER_AGENT);
  }
  if (typeof page.setViewport === "function") {
    await page.setViewport({ width: 1366, height: 900 });
  } else if (typeof page.setViewportSize === "function") {
    await page.setViewportSize({ width: 1366, height: 900 });
  }
  await page.setExtraHTTPHeaders({ "Accept-Language": "pt-BR,pt;q=0.9" });

  const response = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: timeoutMs,
  });
  const status = response ? response.status() : null;
  await page.waitForSelector(CARD, { timeout: timeoutMs });

  // The grid is virtualized: cards leave the DOM when they scroll out of view, so
  // collect what is rendered at each step while scrolling down a screen at a time.
  // More cards load near the end; stop after a few steps with nothing new.
  const products = new Map();
  let scrolls = 0;
  let stale = 0;
  while (true) {
    const before = products.size;
    for (const card of await page.evaluate(extractCards, CARD)) {
      if (card.asin && !products.has(card.asin)) products.set(card.asin, card);
    }
    stale = products.size > before ? 0 : stale + 1;
    if (scrolls >= maxScrolls || products.size >= maxProducts || stale >= 3) {
      break;
    }
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.8));
    scrolls++;
    await sleep(settleMs);
    await page.waitForSelector(CARD, { timeout: timeoutMs }).catch(() => {});
  }

  return {
    url,
    status,
    scrolls,
    products: [...products.values()].slice(0, maxProducts),
  };
}
