# Project Architecture
## Frontend
The following libraries will be used:
- Typescript: Main development language
- Next.js: Interface manager framework
- React.js: Interface builder/componentize library
- Biome: Formatting/Validating/Fixing code (lint)
- TailwindCSS: Style
- Date-FNS: Date/Hour manipulation
- shadcn: Design System
- React Query: Query management
- Translation (`specs/i18n.md`): no library. Pages live under `src/app/[lang]/` (`en`, `pt-BR`), `src/proxy.ts` redirects URLs without a locale, Server Components read it with `next/root-params` (`src/i18n/server.ts`) and client components through a small provider (`src/i18n/client.tsx`) that receives only the messages they use

## Backend
The following libraries will be used:
- Typescript: Main development language
- Next.js: API manager framework
- bcrypt js: salt+hash password generation
- Mastra.ai: Customization and development of internal Agents
- tRPC: Endpoint management
- node:crypto: session token generation and hashing

## Database
Supabase: PostgreSQL
- Local development: Supabase CLI (`supabase start`), schema in `supabase/migrations`
- Hosted: Supabase project, linked with `supabase link` and migrated with `supabase db push`
- Only the server accesses the database (secret key via env vars); tables use RLS with no public policies
- Tables: `accounts`, `sessions`, `products`, `feedbacks`, `product_feedback_summaries`, `app_flags`; view `available_products`
- Product search: PostgreSQL full-text search (`portuguese` config) on a generated `tsvector` column with a GIN index
- Access through PostgREST (`@supabase/supabase-js`) with the client typed by generated types: `src/types/database.ts` comes from `supabase gen types typescript --local` (`pnpm db:types`, re-run after every schema change). Row types in `src/server/**/queries.ts` are derived from it (`Pick<Tables<"…">, …>`, function `Returns`) instead of being written by hand

## Background work
- Next's `after()` (`next/server`) runs work once the response is sent, wrapped in `runInBackground()` (`src/server/background.ts`, mocked in unit tests; errors are logged)
- After `feedback.create` succeeds, the product's AI summary is refreshed there (same rules as the page: 3 reviews minimum, 10% growth, AI breaker). The page keeps generating as a fallback when a summary is missing or stale
- `POST /api/v1/summaries/warm` (`pnpm summaries:warm`, Bearer token) fills missing or stale summaries one at a time after a seed or an import

## Authentication
- Own server-side sessions (no Supabase Auth): `sessions` table + opaque random token in the `prs_session` HttpOnly cookie; only the token's SHA-256 hash is stored
- Data Access Layer: `getCurrentUser()` / `requireUser()` for Server Components (behind `<Suspense>`, Cache Components); `protectedProcedure` for tRPC
- REST routes in `/api/v1` run the same tRPC procedures through `createCaller` with the same context

## Tests
- Vitest: unit tests (`src/**/*.test.ts`)
- Playwright: end-to-end tests (`e2e/`) against a production build and the local database, with fixture products seeded through the import endpoint

## Infrastructure
Vercel: Host server (API) and client (SPA)

## Automation
N8N: Automated workflow creation
- Local n8n (Docker, `docker-compose.n8n.yml`) runs the "Amazon deals import" workflow on demand (manual by default; an optional daily 00:00 America/Sao_Paulo schedule is off until `pnpm n8n:schedule:on`)
- Browserless (headless Chrome, Docker) renders https://www.amazon.com.br/deals, which answers plain HTTP with a 503; the extraction script (`n8n/browserless/extract-deals.js`) runs inside the page
- n8n posts batches to `POST /api/v1/products/import` (Bearer token); the app validates, normalizes and upserts by ASIN

## Possible future changes
- **A typed Postgres client or ORM (e.g. Drizzle) through the Supabase pooler instead of PostgREST.** It would give SQL-level joins, transactions and query types without the generated-types step, and remove the casts left around embedded selects. Not done now because the app already works through PostgREST with typed results, every query and test (the fake Supabase client) would have to be rewritten, and direct connections from serverless functions need the pooler (transaction mode, no prepared statements) and careful connection limits on the free plan. Worth revisiting if the queries outgrow PostgREST (multi-table transactions, complex reporting)
