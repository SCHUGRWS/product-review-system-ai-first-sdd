# Execution plan: product, home (updated), feedback (updated)

| Spec | Plan |
|---|---|
| [`specs/product.md`](../../specs/product.md) (new) | [`product.md`](product.md) |
| [`specs/home.md`](../../specs/home.md) (updated) | [`home.md`](home.md) |
| [`specs/feedback.md`](../../specs/feedback.md) (updated) | [`feedback.md`](feedback.md) |

Same model as round 01 ([`../01-sign-in-home-feedback/execution.md`](../01-sign-in-home-feedback/execution.md)): the orchestrator writes a shared contract first (Phase 0), then three sub-agents build the specs in parallel in the same working tree, each editing only the files it owns, and the orchestrator integrates and verifies (Phase 2).

## Findings that shaped the plan (checked on 2026-10-18)
- `https://www.amazon.com.br/deals` with plain HTTP (curl, browser user agent): **503** "Algo deu errado" (bot block). So n8n's HTTP Request node alone cannot read it
- The same page in headless Chromium: **200**, 30 cards with `data-testid="product-card"` and `data-asin`, title in `#title-<ASIN>`, image `m.media-amazon.com`, price in `data-testid="price-section"`, rating in `review-*`, more cards on scroll
- Categories: 23 filter bubbles (`filter-bubble-deals-collection-<slug>`); the category URL is `/deals?bubble-id=deals-collection-<slug>` (confirmed for `tvs`)
- Local n8n image `docker.n8n.io/n8nio/n8n:2.43.6` is already pulled; no container is running. Browserless is not pulled yet

## Phase 0: shared contract (orchestrator)

### Types and server signatures (stubs; bodies by the product agent)
```ts
// src/features/products/product.types.ts
export type Product = {
  id: string;
  asin: string;
  title: string;
  url: string;              // https://www.amazon.com.br/dp/<ASIN>
  imageUrl: string;         // m.media-amazon.com
  priceCents: number;
  listPriceCents: number | null;
  discountPercent: number | null;
  currency: "BRL";
  rating: number | null;    // Amazon rating, 0-5
  reviewCount: number | null;
  category: { slug: string; name: string };
  lastSeenAt: Date;
};
export type ProductCategory = { slug: string; name: string; count: number };
export type ProductPage = { items: Product[]; total: number; page: number; pageSize: number };

// src/server/products/queries.ts (server-only)
export async function listCategories(): Promise<ProductCategory[]>;
export async function listProducts(opts: {
  category?: string;
  sort: "discount" | "rating" | "recent";
  minReviews?: number;
  page?: number;           // 1-based
  pageSize?: number;       // default 20, max 60
}): Promise<ProductPage>;
export async function searchProducts(q: string, opts?: { page?: number; pageSize?: number }): Promise<ProductPage>;
export async function getProductById(id: string): Promise<Product | null>;
```

### UI contract
- `src/features/products/product-card.tsx`: `ProductCard({ product }: { product: Product })` placeholder (title link to `product.url`, "Give feedback" link to `productFeedbackHref(product.id)`)
- `src/lib/routes.ts`: `productFeedbackHref(id) => "/products/${id}/feedback"`, `ME_PATH = "/me"`, `HOME_PATH = "/home"`
- `src/features/products/format.ts`: `formatPrice(cents)` → "R$ 1.999,94" (used by product card and feedback page)

### Import payload (what n8n sends; also used by the E2E fixtures)
`e2e/fixtures/products.ts` defines `ImportBatch = { category: { slug, name }, products: RawProduct[] }` with raw strings as read from the page: `price: "R$ 1.999,90"`, `listPrice`, `discountPercent`, `rating: "4,5"`, `reviewCount: "(1.234)"`, plus `asin`, `title`, `url`, `imageUrl`. The import schema accepts this shape.

### Router
`productRouter` (empty) is registered in `_app.ts` by Phase 0; the product agent fills `src/server/routers/product.ts` only.

### Migrations (timestamps reserved, in this order)
- `20261018100000_create_products.sql`: product agent
- `20261018110000_feedbacks_product.sql`: feedback agent (depends on `products`)

### Other
- `next.config.ts`: `images.remotePatterns` for `https://m.media-amazon.com/images/**` (orchestrator, so no agent edits the config)
- `.env.example`: `PRODUCTS_IMPORT_TOKEN=`; `playwright.config.ts`: passes a test token to the web server
- `e2e/helpers.ts`: `seedProducts(request, products)` posts fixtures to `/api/v1/products/import` with the token; `e2e/fixtures/products.ts` with ~30 fake products in 4 categories (no Amazon data needed for E2E)

Phase 0 ends with lint, typecheck, unit tests and build green.

## Phase 1: parallel implementation

| Agent | Owns |
|---|---|
| product | `n8n/**`, `docker-compose.n8n.yml`, products migration, `src/server/products/**`, `src/features/products/**` (except the type file, fixed by Phase 0), `src/app/api/v1/products/**`, `src/server/routers/product.ts`, `e2e/products-import.spec.ts` |
| home | `src/app/home/**`, `src/app/me/**`, `src/features/home/**`, `src/features/catalog/**`, `src/components/app-header.tsx`, `e2e/home.spec.ts`, `e2e/me.spec.ts` |
| feedback | feedback migration, `src/features/feedback/**`, `src/server/feedback/**`, `src/server/routers/feedback.ts`, `src/app/products/**`, `src/app/feedback/**`, `src/app/api/v1/feedback/**`, `e2e/feedback.spec.ts` |

Same rules as round 01: read `AGENTS.md` and the Next.js docs first; edit only owned files; tests for everything in the plan's table; `pnpm lint`, `pnpm typecheck` and own Vitest files green; no dev server, build, Playwright, Docker or database commands; no commits.

Exception for the product agent: it may run `docker compose -f docker-compose.n8n.yml` and the n8n CLI to build and test the workflow, since nobody else uses those containers. It must not touch the Supabase containers.

## Phase 2: integration and verification (orchestrator)
1. Review each agent's work against its spec
2. `supabase migration up --local`
3. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`
4. `pnpm test:e2e` (fixtures, no Amazon)
5. Real import:
    1. `pnpm dev`
    2. start n8n + Browserless and import the workflow
    3. run the workflow once manually (first load, so the catalog is not empty before the first 00:00 run)
    4. check `products` has deals from at least 5 categories
    5. run it again and check there are no duplicates
6. Screenshots of `/home`, a category, a search, `/me` and the feedback page (desktop and mobile)
7. Documentation:
    1. README: features, n8n setup, import endpoint, new routes
    2. ARCHITECTURE: n8n + Browserless, products, search
    3. spec "Results" if anything differs
    4. an execution log in this file

## Approved decisions (2026-10-18)
1. **Scraping with Browserless only** (`ghcr.io/browserless/chromium`, pinned): it renders the page and the extraction runs inside it, with scrolling. ScraperAPI was considered and dropped: the free tier (1,000 credits/month) does not cover ~1,440 rendered Amazon requests/month, and it adds a paid account. Scraping goes against Amazon's Conditions of Use; accepted for a local study project at low frequency (once a day at 00:00, one category at a time; first load run manually)
2. **Routes**: `/home` = catalog (signed-in only), the former home moves to `/me`, feedback at `/products/<id>/feedback`, `/feedback/new` redirects to `/home`
3. **Lists on /home**: "Biggest discounts", "Top rated" (≥ 50 Amazon reviews), then one list per category, up to 20 items each, with "See all"
4. **Search**: PostgreSQL full-text search (Portuguese) over the title, minimum 2 characters, 24 per page
5. **One feedback per user per product** (409 on repeat)
6. **Old feedback** (typed product name) is kept with an empty `product_id`
7. **Import endpoint returns 200** (a batch both creates and updates)
8. **Availability**: seen in the last 3 days; older products leave lists and search, their feedback page keeps working
9. **Product titles stay in Portuguese**; UI copy in English; category names use English labels
10. **E2E uses fixture products** through the import endpoint; the real n8n import is verified in Phase 2

## Execution log (2026-10-18)
All three agents delivered. Final state:
- `pnpm lint`, `pnpm typecheck` and `pnpm build` pass
- Vitest: 30 files, 274 tests
- Playwright: 33 tests, run twice, the second time with 1,001 real products in the database
- No errors in the server log

Real import (first load, run manually through `n8n execute`):
- The full run reads 23 pages at about 1 minute per page
- Stopped at the user's request after **1,001 products** from the general page and 6 categories (books, computers, beauty, eBooks, baby, automotive)
- All ASINs are unique
- 456 products have 50 or more reviews and qualify for "Top rated"
- 327 products have no Amazon rating (mostly books); 7 have no discount
- The daily 00:00 schedule is published and will complete the other categories

Changes made during integration (Phase 2):
- The feedbacks migration drops `feedbacks_product_name_check` without `if exists`. The name was checked in the database, and a mismatch now fails loudly instead of leaving the old 2..120 rule in place
- `e2e/global-teardown.ts` deletes E2E accounts (`e2e-*@example.com`, which cascades to sessions and feedback) and fixture products (`E2E*` ASINs) after each run, so test data does not pollute the local catalog. Test data from earlier runs (69 accounts, 64 products) was deleted once by hand

Deviations accepted from the agents:
- product:
  - product `id` is generated by the database (`products_nanoid()`) so upserts by ASIN keep it
  - `list_product_categories(since)` SQL function for the category counts
  - category names use English labels by slug
  - the general page uses slug `deals-all`, labelled "More deals"
  - the extraction test is a Playwright spec, because it needs a real DOM
  - search results are ordered by review count, then rating (no relevance ranking)
  - the extractor collects cards at each scroll step, because the Amazon grid is virtualized
- home:
  - category grids show 24 per page
  - "See all" appears only on category lists
  - `cache(requireUser)` shares one session lookup per request
  - `e2e/home.spec.ts` seeds an extra "Paging test" category
- feedback:
  - page sections live in `src/features/feedback/product-feedback.tsx`
  - the unique index decides duplicates, so concurrent posts can't both succeed
  - `shortTitle()` fits long Amazon titles on the slip
  - an unknown product shows the 404 page, but the HTTP status may be 200 because the page streams behind `<Suspense>`

Operational notes:
- Running `n8n execute` while n8n is up needs `-e N8N_RUNNERS_BROKER_PORT=5690`
- n8n logs "Python 3 is missing" at start; only the JS runner is used
- Browserless logs "react-virtuoso: Zero-sized element" from Amazon's own page; extraction is not affected

