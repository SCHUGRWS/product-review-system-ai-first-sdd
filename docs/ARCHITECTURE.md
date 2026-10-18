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
- Tables: `accounts`, `sessions`, `products`, `feedbacks`
- Product search: PostgreSQL full-text search (`portuguese` config) on a generated `tsvector` column with a GIN index

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