# Product Review System

Spec-driven project: features are described in [`specs/`](specs) before implementation, and their implementation plans live in [`plans/`](plans).
Stack and components: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Implemented features
- **Sign-up** ([spec](specs/sign-up.md)): page at `/auth/sign-up`, tRPC procedure `auth.signUp`, REST endpoint `POST /api/v1/sign-up`.
- **Sign-in** ([spec](specs/sign-in.md), [plan](plans/01-sign-in-home-feedback/sign-in.md)): page at `/auth/sign-in`, tRPC `auth.signIn` / `auth.signOut`, REST `POST /api/v1/sign-in` and `POST /api/v1/sign-out`. Sessions last 7 days.
- **Product** ([spec](specs/product.md), [plan](plans/02-products/product.md)): catalog imported on demand from Amazon Brazil deals by a local n8n workflow (an optional daily schedule is off by default) ([`n8n/`](n8n/README.md)), REST `POST /api/v1/products/import`, tRPC `product.search` / `product.byId`.
- **Home** ([spec](specs/home.md), plans [01](plans/01-sign-in-home-feedback/home.md) and [02](plans/02-products/home.md)): `/home` is the product catalog (lists, category pages, search); `/me` is the user's page (account, recent feedback, sign-out).
- **Feedback** ([spec](specs/feedback.md), plans [01](plans/01-sign-in-home-feedback/feedback.md) and [02](plans/02-products/feedback.md)): review of a catalog product at `/products/<id>/feedback` with a live review slip preview, one per user per product; tRPC `feedback.create` / `feedback.listMine` / `feedback.hasReviewed`, REST `POST /api/v1/feedback`.

## Requirements
- Node.js 24+ and pnpm
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
- Docker (local database, n8n and Browserless)

## Running locally
Step-by-step guide (first setup, starting after a restart, checking, stopping, troubleshooting): [`docs/RUNNING.md`](docs/RUNNING.md). Short version:

```bash
pnpm install
pnpm db:start          # starts local Supabase and applies supabase/migrations
cp .env.example .env.local
# fill SUPABASE_SECRET_KEY with the "Secret" key printed by `supabase status`
pnpm dev               # http://localhost:3000
```

Fill `PRODUCTS_IMPORT_TOKEN` too (`openssl rand -base64 32`): the n8n workflow uses it to send products.

After pulling new migrations, apply them without wiping local data:
```bash
supabase migration up --local
```

## Loading products (n8n)
The catalog comes from https://www.amazon.com.br/deals. A local n8n workflow renders the pages in headless Chrome (Browserless), extracts the deal cards and posts them to the app. The import is manual by default: it runs when you click "Execute workflow" in n8n or run the CLI command.
```bash
pnpm dev               # or pnpm start; n8n reaches the app at host.docker.internal:3000
pnpm n8n:up            # n8n (http://localhost:5678) + Browserless
pnpm n8n:import        # import the workflow (unpublished: the daily schedule stays off)
```
Then open n8n and run "Amazon deals import" (or use the CLI command in [`n8n/README.md`](n8n/README.md)). A full run reads 23 pages and takes about 20 minutes. Stop with `pnpm n8n:down`. For a daily run at 00:00 (America/Sao_Paulo) while n8n is up, `pnpm n8n:schedule:on` publishes the workflow (`pnpm n8n:schedule:off` turns it off again).

`APP_URL` tells n8n where to send the products: `http://host.docker.internal:3000` (default, the app on this machine) or `https://<project>.vercel.app` to import into the deployed app, with the same `PRODUCTS_IMPORT_TOKEN` set in Vercel. Set it in `.env.local` and restart n8n (`pnpm n8n:up`).

Lists, category pages and search show the products of the latest import: those seen within 3 days before the most recent import, however old it is. Amazon may change its HTML: all selectors live in `n8n/browserless/extract-deals.js`, covered by `e2e/products-extract.spec.ts`.

## Using a hosted Supabase project
The code is the same for local and hosted databases. Only the environment variables change.

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. Link it and apply the migrations:
   ```bash
   supabase login
   pnpm db:link --project-ref <project-ref>
   pnpm db:push
   ```
3. In `.env.local`, or in the Vercel project's environment variables, set:
   ```bash
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_SECRET_KEY=sb_secret_...   # Project Settings > API Keys
   ```

The secret key bypasses Row Level Security, so keep it server-side only and never prefix it with `NEXT_PUBLIC_`. The `accounts`, `sessions`, `products`, `feedbacks`, `product_feedback_summaries` and `app_flags` tables have RLS enabled and no policies, so the public (publishable/anon) key cannot read or write them.

## Deploying (Vercel)
Import the repository in Vercel, set the two variables above (plus `PRODUCTS_IMPORT_TOKEN` if an n8n instance will import into it, and `OPENAI_API_KEY` for the AI summary), and deploy. Vercel serves the app over HTTPS, and the app sends an HSTS header in production. Free-plan details: [`docs/DEPLOY.md`](docs/DEPLOY.md).

- **Product images** load straight from `m.media-amazon.com` (`next/image` with `unoptimized`, Amazon's own size variants as `srcSet`), so they never use Vercel Image Optimization or its Hobby quota.
- **AI summary** circuit breaker: when OpenAI answers with a quota or billing error (`insufficient_quota`, `billing_hard_limit_reached`) or rejects the key (401), the app stops calling the model for `AI_DISABLED_HOURS` (default 6), stored in the `app_flags` table. Cached summaries still show; products without one show "Summary unavailable right now". Timeouts and 5xx errors do not trip it. To turn the AI back on sooner, clear `app_flags.ai_disabled_until`.

## Scripts
| Script | Description |
|---|---|
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build / server |
| `pnpm lint` / `pnpm format` | Biome check / format |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:e2e` | End-to-end tests (Playwright): builds the app, starts it on port 3000 and runs `e2e/` against the local database |
| `pnpm db:start` / `pnpm db:stop` | Start / stop local Supabase |
| `pnpm db:reset` | Recreate the local database from migrations |
| `pnpm db:link` / `pnpm db:push` | Link a hosted project / apply migrations to it |
| `pnpm db:test` | SQL tests in `supabase/tests` (pgTAP) against the local database, rolled back |
| `pnpm n8n:up` / `pnpm n8n:down` | Start / stop n8n and Browserless |
| `pnpm n8n:import` | Import the deals workflow in n8n (unpublished: manual runs only) |
| `pnpm n8n:schedule:on` / `pnpm n8n:schedule:off` | Publish / unpublish the workflow, turning the daily 00:00 run on / off |
| `pnpm n8n:build` | Rebuild the workflow JSON after editing `n8n/build-workflow.mjs` or the extractor |

## Tests
- **Unit (Vitest):** `src/**/*.test.ts`. The database and Next.js request APIs are mocked, so no services are needed.
- **SQL (pgTAP):** `supabase/tests/*.sql`, run with `pnpm db:test` against the local database. Each file runs in a transaction that is rolled back, so local data is kept.
- **End-to-end (Playwright):** `e2e/*.spec.ts`. Requires the local database (`pnpm db:start`) with migrations applied and `PRODUCTS_IMPORT_TOKEN` in `.env.local`. Tests seed fixture products through the import endpoint (no Amazon access), and a global teardown deletes the test accounts (`e2e-*@example.com`) and fixture products (`E2E*` ASINs) at the end. The first run may need `pnpm exec playwright install chromium` (and `sudo pnpm exec playwright install-deps chromium` on a bare Linux/WSL).

## Authentication
Signing in creates a row in `sessions` and sets the `prs_session` cookie (`HttpOnly`, `SameSite=Lax`, `Secure` in production, 7 days). The cookie holds a random token; the database stores only its SHA-256 hash. Signing out deletes the row and clears the cookie. Server Components read the user with `getCurrentUser()` / `requireUser()` (`src/server/auth/current-user.ts`), and tRPC procedures that need a user use `protectedProcedure`.

## REST API
All bodies are JSON. Errors have the shape `{ "error" }`, plus `fields` (field-level messages) on validation errors.

### `POST /api/v1/sign-up`
On Vercel, sign-up is protected by Vercel BotID: requests must come from the app's pages (the browser attaches a challenge), so plain `curl` calls get `403`. Locally the check is skipped.
```json
{ "firstName": "Ada", "lastName": "Lovelace", "email": "ada@example.com",
  "password": "supersecret", "confirmPassword": "supersecret" }
```
| Status | Meaning |
|---|---|
| 201 | Account created: `{ "id", "email" }` |
| 400 | Invalid JSON or invalid fields: `{ "error", "fields" }` |
| 403 | Blocked by BotID (Vercel only) |
| 409 | Email already registered |
| 500 | Unexpected server error (logged on the server) |

### `POST /api/v1/sign-in`
```json
{ "email": "ada@example.com", "password": "supersecret" }
```
| Status | Meaning |
|---|---|
| 200 | Signed in: `{ "id", "firstName", "lastName", "email" }` and the `prs_session` cookie |
| 400 | Invalid JSON or invalid fields |
| 401 | Invalid email or password (also for inactive accounts) |
| 500 | Unexpected server error |

### `POST /api/v1/sign-out`
No body. Always `200 { "ok": true }`, and clears the cookie (with or without a session). `500` if the session could not be deleted.

### `POST /api/v1/feedback`
Authenticated by the `prs_session` cookie.
```json
{ "productId": "V1StGXR8_Z5jdHi6B-myT", "rating": 4,
  "comment": "Boils fast and the lid doesn't drip." }
```
| Status | Meaning |
|---|---|
| 201 | Feedback created: `{ "id", "product": { "id", "title", "imageUrl", "url" }, "rating", "comment", "createdAt" }` |
| 400 | Invalid JSON or invalid fields (rating 1–5, comment 10–2000 chars) |
| 401 | Not signed in |
| 404 | Product not found |
| 409 | The user already reviewed this product |
| 500 | Unexpected server error |

### `POST /api/v1/products/import`
Used by the n8n workflow. Authenticated by `Authorization: Bearer <PRODUCTS_IMPORT_TOKEN>`. Upserts by ASIN (existing products keep their id).
```json
{ "category": { "slug": "deals-collection-tvs", "name": "TVs" },
  "products": [{ "asin": "B0HCRPPXB1", "title": "Smart TV LG 55\" 4K", "url": "https://www.amazon.com.br/dp/B0HCRPPXB1",
    "imageUrl": "https://m.media-amazon.com/images/I/....jpg", "price": "R$ 2.999,00", "listPrice": "R$ 3.999,00",
    "discountPercent": 25, "rating": "4,6", "reviewCount": "(1.234)" }] }
```
| Status | Meaning |
|---|---|
| 200 | `{ "received", "saved", "skipped": [{ "index", "reason" }] }`; invalid items are skipped, the rest saved |
| 400 | Invalid JSON, missing category, or more than 100 products |
| 401 | Missing or wrong token |
| 500 | Unexpected server error |
