# Execution plan: demo data, architecture fixes, translation

Approved 2026-10-18.

## Decisions
- **Demo data** ships as a data migration (runs everywhere with `supabase db push`, unlike `seed.sql`). It contains:
  - all current products
  - the synthetic demo accounts and their feedback, plus ~1,000 new feedbacks
  - the pre-generated AI summaries
- **The user's real accounts and their feedback are excluded**
- **One public demo login** documented in the README (`demo@example.com`). Other demo authors can't log in (random, discarded passwords)
- **Feedback comments** are generated once with OpenAI `gpt-4.1-nano` (the user's key) and stored as SQL; no API call at deploy time
- **Architecture 5a:** after a feedback is created, the summary is regenerated in the background with Next's `after()`, following the same 10% rule, so visitors never wait for the AI. A protected warm-up command fills missing summaries (used after seeding/imports)
- **Architecture 5b:** database types are generated with `supabase gen types` and replace the hand-written row types
- **Architecture 5d (Postgres driver/ORM):** not done; documented as a possible future change
- Root `not-found.tsx` with the disclaimer footer
- **Translation** follows `plans/03-product-reviews/i18n.md`; its migration moves to `20261018220000_accounts_locale.sql`

## Waves
| Wave | Agent | Scope | Owns |
|---|---|---|---|
| 1 | X | 5a + 5b + root 404 | `src/server/**`, `src/mastra/**`, `src/app/not-found.tsx`, `src/types/database.ts`, warm-up route/script |
| 1 | D | demo data (products, accounts, feedback) | `scripts/demo-data/**`, `supabase/migrations/20261018210000_demo_data.sql` |
| 2 | I | translation | UI, dictionaries, `proxy.ts`, account locale |
| 2 | D | summaries into the demo migration (uses X's warm-up) | same as wave 1 |
| end | orchestrator | migrations, lint, typecheck, unit tests, build, full E2E once; docs; one commit + push | |
