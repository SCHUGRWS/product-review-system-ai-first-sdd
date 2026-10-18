# Demo data

## Scope
A data migration that fills any new deployment with a product catalog, synthetic reviewers, reviews and (later) cached AI summaries, plus one public demo login.

## Context
A fresh deployment (`supabase db push`) has an empty catalog and no reviews, so the home page, product pages and AI summaries have nothing to show. `seed.sql` only runs on local resets, so the content ships as a migration (`supabase/migrations/20261018210000_demo_data.sql`). Plan: `plans/04-demo-data-architecture/execution.md`.

## Functional requirements
- Products: every product of the local catalog snapshot, with its `id` (feedback references it) and its `first_seen_at`/`last_seen_at`.
- Accounts: the 6 `demo-<name>@example.com` accounts, the public login `demo@example.com` (password `demo-review-2026`, "Demo Visitor"), and 60 reviewers with Brazilian names (`<first>.<last>.<n>@example.com`).
- Feedback: the demo accounts' existing reviews plus ~1,000 new ones on ~200 products from every category, 3–12 per product. Ratings follow a product profile (positive, mixed or negative) so AI summaries vary. Comments are in Brazilian Portuguese, 1–3 sentences, specific to the product title. Dates are spread over the 120 days before the catalog import. `product_name` is the product title.
- Summaries: an optional `scripts/demo-data/summaries.json` adds `product_feedback_summaries` rows.
- Regeneration: `scripts/demo-data/export-current.mjs` (local DB → JSON), `generate.mjs` (accounts + comments with OpenAI `gpt-4.1-nano`; resumable through `comments-cache.json`), and `build-migration.mjs` (JSON → SQL).

## Non-Functional requirements
- Idempotent: every insert uses `on conflict do nothing`. A second run is a no-op, and existing rows are never changed.
- Deterministic: the same JSON always gives the same SQL.
- Feedback and summaries are joined to the inserted accounts/products, so a row is skipped when its account or product was skipped (an email or asin that already exists with another id).
- Comments are generated once; no API call at deploy time. Generation stops after 150 requests. The first run used 68 requests, ~90k input and ~85k output tokens (about US$0.04).

## Must do
- Hash passwords with bcrypt cost 12, like sign-up (`password` = hash, `salt` = the hash's salt prefix).
- Keep the constraints: one feedback per account and product, comment 10..2000 chars (generated: 10..600, no URLs or emails), rating 1..5, `product_name` 1..500 chars.

## Must not do
- Export real user accounts or their feedback: the export selects only `demo-<name>@example.com`, and the builder refuses any email outside the synthetic patterns.
- Store secrets: `OPENAI_API_KEY` is read from `.env.local` and never written. The JSON files are commit-safe.
- Make other demo accounts usable: their passwords are random and discarded.

## Technologies (Stack)
Node scripts (`bcryptjs`, `nanoid`, `zod`, `fetch` to the OpenAI Chat Completions API with JSON output), PostgreSQL data migration for Supabase.

## Acceptance criteria
- On an empty database, all migrations apply with no errors and give 1,001 products, 67 accounts, 1,064 feedbacks, and 196 products with at least 3 reviews.
- Running the demo migration a second time inserts nothing.
- No account email outside `@example.com`.
- `demo@example.com` / `demo-review-2026` signs in.

## Results
Verified on a throwaway Postgres 17 container (all migrations in order, then the demo migration again). Counts as above, zero constraint violations, zero non-example emails. Applied to the local DB with `supabase migration up --local`: 61 new accounts and 992 new feedbacks, existing rows untouched.
