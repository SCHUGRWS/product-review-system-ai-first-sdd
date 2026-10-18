# Implementation plan: Product

Spec: [`specs/product.md`](../../specs/product.md)

Prerequisite: Phase 0 of [`execution.md`](execution.md) is done (types, query signatures, `ProductCard` placeholder, routes, image config, import token env).

## 1. Database
- `supabase/migrations/20261018100000_create_products.sql`
  - table `public.products` as in requirement 4, with checks: `price_cents >= 0`, `discount_percent between 0 and 100`, `rating between 0 and 5`
  - `search tsvector generated always as (to_tsvector('portuguese', title)) stored` + GIN index
  - indexes: `(category_slug, last_seen_at desc)`, `(discount_percent desc)`, `(rating desc, review_count desc)`, `(last_seen_at)`
  - RLS enabled, no policies

## 2. Import endpoint
- `src/features/products/import.schema.ts`: `importBatchSchema` (category `{ slug, name }`, 1..100 products) and `rawProductSchema`, which normalizes:
  - `parsePrice("R$ 1.999,94") → 199994` (also "1.999,94", "R$1.999,94", non-breaking spaces; null for empty)
  - ASIN `^[A-Z0-9]{10}$`; canonical URL from the ASIN
  - image URL must be `https://m.media-amazon.com/...`
  - discount: taken from the payload, or computed from price and list price
  - rating 0..5 (accepts "4,5"); review count accepts "(1.234)"
- `src/server/products/import.ts`: `importProducts(batch)` → `{ received, saved, skipped }`
  - validates items one by one, so bad items are skipped with a reason
  - one `upsert(..., { onConflict: "asin" })` for the valid ones, with `last_seen_at = now()` and `first_seen_at` kept on conflict
- `src/server/products/import-auth.ts`: `isAuthorizedImport(header)` (Bearer, `timingSafeEqual`, false when `PRODUCTS_IMPORT_TOKEN` is not set)
- `src/app/api/v1/products/import/route.ts`: 401 / 400 / 200 / 500 as in the spec, using `src/app/api/v1/_lib/to-response.ts`

## 3. Reading products
- `src/server/products/queries.ts` (replace stubs; keep signatures)
  - "available" = `last_seen_at > now() - interval '3 days'`
  - `listCategories` (with counts)
  - `listProducts` (sort `discount` / `rating` with `minReviews` / `recent`; pagination with exact count)
  - `searchProducts` (`textSearch("search", q, { type: "websearch", config: "portuguese" })`)
  - `getProductById`
  - row → `Product` mapping
- `src/features/products/categories.ts`: slug → English label map for the 23 categories ("deals-collection-video-games" → "Video games"); unknown slugs fall back to the name sent by n8n
- `src/server/routers/product.ts`: `product.search` (q ≥ 2 chars, page) and `product.byId` on `protectedProcedure`; registered in `_app.ts` (only line this agent adds there)

## 4. Product card
- `src/features/products/product-card.tsx` (replace placeholder):
  - `next/image` 1:1 at a fixed size
  - title clamped to 2 lines as an external link (`target="_blank"`, `rel="noopener noreferrer nofollow"`, with a visually hidden "(opens Amazon)")
  - price, list price crossed out, discount badge in cobalt
  - Amazon stars (reuse `Stars`) and review count
  - "Give feedback" button (`Link` to `productFeedbackHref`)
  - quiet paper card, cobalt-tinted shadow on hover, no grey shadows
- `src/features/products/product-card-skeleton.tsx`
- `src/features/products/format.ts` (replace stub): `formatPrice`, `formatReviewCount`

## 5. n8n + Browserless
- `docker-compose.n8n.yml`:
  - `n8n` (`docker.n8n.io/n8nio/n8n:2.43.6`, port 5678, volume `n8n_data`, `extra_hosts: host.docker.internal:host-gateway`, env `APP_URL=http://host.docker.internal:3000`, `PRODUCTS_IMPORT_TOKEN`)
  - `browserless` (`ghcr.io/browserless/chromium` pinned, `TOKEN` env, `CONCURRENT=1`)
- `n8n/workflows/amazon-deals-import.json`:
  1. Manual Trigger + Schedule Trigger (daily at 00:00; `GENERIC_TIMEZONE=America/Sao_Paulo` and `TZ` set in the compose file)
  2. Code "Categories": the general page plus the 23 `deals-collection-*` slugs
  3. Split in Batches (size 1) → HTTP Request to Browserless `POST /function` with `n8n/browserless/extract-deals.js`:
     - open the URL (pt-BR locale, desktop UA)
     - wait for `[data-testid="product-card"]`
     - scroll up to 4 times
     - return `[{ asin, title, url, imageUrl, price, listPrice, discountPercent, rating, reviewCount }]`
  4. Code "Batch": chunks of 100 → HTTP Request `POST {{APP_URL}}/api/v1/products/import` with `Authorization: Bearer {{PRODUCTS_IMPORT_TOKEN}}`
  5. Wait 5–10 s between categories
  6. "Continue on fail" on the Browserless and import nodes
  7. A final Code node with the summary
- `n8n/browserless/extract-deals.js`: the extraction function, the single source of truth. A small script `n8n/build-workflow.mjs` inlines it into the workflow JSON, so the JSON and the tested file never drift
- `n8n/README.md`:
  1. `docker compose -f docker-compose.n8n.yml up -d`
  2. `docker compose ... exec n8n n8n import:workflow --input=/workflows/amazon-deals-import.json`
  3. open http://localhost:5678 and run it
- `package.json` scripts (the only change this agent makes there): `n8n:up`, `n8n:down`, `n8n:import`, `n8n:build`

## 6. Tests (Vitest)
| File | Cases |
|---|---|
| `src/features/products/import.schema.test.ts` | `parsePrice` for "R$ 1.999,94", "R$1.999,94", "1.999,94", "R$ 49,90", NBSP, "" / null; ASIN validation; canonical URL drops tracking params; rejects non-Amazon image; computes discount when missing; rating "4,5" → 4.5; review count "(1.234)" → 1234; batch > 100 rejected |
| `src/server/products/import.test.ts` | valid items upserted on `asin` with `last_seen_at`; invalid items skipped with index and reason while the rest are saved; empty valid set skips the DB call; DB error throws |
| `src/server/products/import-auth.test.ts` | right token passes; wrong / missing / non-Bearer fail; fails closed when the env var is unset |
| `src/app/api/v1/products/import/route.test.ts` | 200 with summary; 401 without/with wrong token; 400 invalid JSON / missing category / 101 products; 500 |
| `src/server/products/queries.test.ts` | availability filter applied everywhere except `getProductById`; sort and `minReviews`; pagination math and page size cap 60; search uses websearch + portuguese; row mapping |
| `src/server/routers/product.test.ts` | UNAUTHORIZED without user; `search` rejects q < 2; `byId` returns null for unknown |
| `src/features/products/format.test.ts` | `formatPrice(199994)` → "R$ 1.999,94"; 0; `formatReviewCount` |
| `n8n/browserless/extract-deals.test.ts` | runs the extraction against a trimmed fixture of the rendered deals page (`n8n/browserless/__fixtures__/deals.html`, a few cards) and checks the extracted fields (DOM via Playwright's Chromium in a Vitest `node` test, or `e2e/products-extract.spec.ts` if simpler) |

## 7. E2E (Playwright)
- `e2e/products-import.spec.ts`: import with the test token → 200 and products visible through `/home` search; repeat import → same count (no duplicates); wrong token → 401

## 8. Files owned
`supabase/migrations/20261018100000_create_products.sql`, `docker-compose.n8n.yml`, `n8n/**`, `src/server/products/**`, `src/features/products/**` (not `product.types.ts`), `src/app/api/v1/products/**`, `src/server/routers/product.ts` (+ one line in `_app.ts`), `package.json` (n8n scripts only), `e2e/products-*.spec.ts`
