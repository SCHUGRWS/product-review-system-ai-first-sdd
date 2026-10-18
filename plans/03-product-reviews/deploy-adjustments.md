# Implementation plan: adjustments for a free public deployment

Approved 2026-10-18 after the Vercel study ([`docs/DEPLOY.md`](../../docs/DEPLOY.md)). Runs after the product reviews agent and before the translation agent ([`execution.md`](execution.md)).

## 1. AI off when the OpenAI credit runs out (circuit breaker)
- The user prepays a fixed amount; when it ends, the app stops calling Mastra instead of retrying on every visit
- When a summary call fails because of quota or billing, the server records an "AI disabled until" time and skips Mastra until then. This covers OpenAI 429 `insufficient_quota`, `billing_hard_limit_reached`, and 401 invalid key
- The record lives in the database (a single-row `app_flags` table), because Vercel functions don't share memory. It is read with the summary cache lookup
- Default pause: 6 hours (`AI_DISABLED_HOURS`). Other errors (timeout, 5xx) don't trip it
- While disabled:
  - cached summaries still show
  - products without a summary show "Summary unavailable right now"
  - one log line when the breaker trips, instead of one per visit
- No key at all: same "unavailable" state, logged at most once per server instance
- **Tests:**
  - quota / billing / invalid-key errors trip the breaker; a timeout or 500 does not
  - while disabled, the agent is not called and the cache is still served
  - after the pause it tries again
  - the missing-key log line appears only once

## 2. Manual product import by default
- The n8n workflow keeps the Schedule Trigger but ships **disabled**, so the import runs only when the user clicks "Execute workflow" or runs the CLI command. Re-enabling it is documented
- `APP_URL` documented for both targets: local `http://host.docker.internal:3000`, or production `https://<project>.vercel.app` with the same `PRODUCTS_IMPORT_TOKEN` set in Vercel
- `specs/product.md` updated: manual import is the default; the daily schedule is optional

## 3. "Available" = seen in the latest import
- Today: `last_seen_at > now() - 3 days`. With manual imports the catalog would empty itself a few days after the last run
- New rule: products whose `last_seen_at` falls within 3 days before the **most recent** `last_seen_at` in the table, i.e. the latest import run and anything seen shortly before it
  - computed in SQL: `last_seen_at > (select max(last_seen_at) from products) - interval '3 days'`
  - indexed: `last_seen_at` is already indexed
- Lists, category pages, search and category counts use the new rule; `getProductById` is unchanged
- `specs/product.md` and `specs/home.md` updated
- **Tests:**
  - with the latest import 30 days ago, products from that import are still listed
  - products 4+ days older than the latest import are hidden
  - an empty table returns empty lists without errors

## 4. Product images straight from Amazon (no Vercel Image Optimization)
- The database already stores only the image URL. Today `next/image` sends each image through Vercel's optimizer, which counts against the Hobby quota of 5,000 transformations/month
- Change: `next/image` with `unoptimized` everywhere a product image is shown (card, reviews page, feedback page, recent feedback, review slip thumbnail). The browser loads it directly from `m.media-amazon.com`
- `referrerPolicy="no-referrer"`
- Responsive variants come from Amazon's own URL tokens: `_AC_SF226,226_QL85_` / `_AC_SF339,339_QL80_` / `_AC_SF452,452_QL80_` as 1x / 1.5x / 2x via `srcSet`. A helper `amazonImageSrcSet(url)` rewrites the size token, and when the URL doesn't match the known pattern it returns the original URL alone
- Fixed width and height stay, so there is no layout shift; lazy loading stays
- `images.remotePatterns` can stay (harmless); document that optimization is off for Amazon images
- **Tests:**
  - `amazonImageSrcSet` for the known token, a URL without a token, and a non-Amazon URL (rejected)
  - a test that no product image is rendered without `unoptimized` (render helper or source scan)

## Checks
`pnpm lint`, `pnpm typecheck`, `pnpm test`; the orchestrator runs build and full E2E.
