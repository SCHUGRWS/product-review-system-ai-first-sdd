# Execution plan: product reviews + AI summary, then translation

| Spec | Plan |
|---|---|
| `specs/product-reviews.md` (new, written by the agent) | [`product-reviews.md`](product-reviews.md) |
| `specs/i18n.md` (new, written by the agent) | [`i18n.md`](i18n.md) |

Request (2026-10-18):
1. A "See feedback" button on the product card opens a page with the product and its feedback. Above the reviews, an AI summary built with Mastra and a cheap OpenAI model explains the community's overall opinion
2. Translation of the app, with a language switch on the user's profile

## Order: sequential, not parallel
Translation touches every page and component, including the new reviews page, so the two cannot run side by side without conflicts:

1. **Wait for the responsive layout fix** (sub-agent already running), which edits the same layouts and product card
2. **Agent A: product reviews + AI summary.** Updates the specs and implements [`product-reviews.md`](product-reviews.md). All its UI copy goes through a small `t()` placeholder (see below), so the translation step only fills dictionaries
3. **Agent B: translation.** Implements [`i18n.md`](i18n.md) on top of everything, including Agent A's page and the AI summary language
4. **Orchestrator after each agent:**
   - review the work
   - apply migrations (`supabase migration up --local`)
   - `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, full `pnpm test:e2e`
   - fix anything red
   - update README / ARCHITECTURE / RUNNING and the execution log below

Shared contract set up before Agent A starts (orchestrator, Phase 0):
- `src/i18n/t.ts` exporting `t(key, vars?)` that returns the English text
- an `en` dictionary that Agent A fills for its new strings

Agent B replaces it with the real locale-aware version. This avoids rewriting Agent A's strings twice.

Rules for both agents, same as earlier rounds:
- read `AGENTS.md` and the Next.js docs first
- tests for everything in the plan
- lint, typecheck and Vitest green
- no dev server restarts and no `next build` (the orchestrator runs them)
- no commits
- clean up any `e2e-*` test accounts they create

## Approved decisions (2026-10-18)
1. **Model**: the cheapest suitable one, **`openai/gpt-4.1-nano`**, which is non-reasoning
    - prices (third-party trackers): $0.10 per 1M input tokens and $0.40 per 1M output. `gpt-4o-mini` is $0.15 / $0.60
    - `gpt-5-nano` lists a lower input price ($0.05), but it is a reasoning model whose hidden reasoning tokens are billed as output, so its real cost per summary is about the same and less predictable
    - estimated cost: about $0.0006 per summary (≈5k input tokens for 50 reviews, ≈300 output tokens)
    - switchable with `FEEDBACK_SUMMARY_MODEL`
2. **Summary language**: the viewer's language (English or Portuguese), cached per language. Until translation ships, English
3. **Minimum**: 3 reviews before the first summary
4. **Regeneration**: only when the number of reviews grew by at least 10% since the cached summary
    - rule: `current >= ceil(cached × 1.10)`, so at least one more review
    - 3 → 4, 10 → 11, 20 → 22, 50 → 55, 100 → 110
    - between regenerations the cached summary is shown with its review count ("Summary of 50 reviews")
5. **Route**: `/products/<id>`, signed-in only
6. **Card**: "See feedback" without a count

Sources for prices: [LLM Reference: gpt-4.1-nano](https://www.llmreference.com/model/gpt-4.1-nano/openai-api), [LLM Reference: gpt-4o-mini](https://www.llmreference.com/model/gpt-4o-mini/openai-api), [Wise: OpenAI pricing](https://wise.com/au/blog/openai-pricing). Confirm on OpenAI's pricing page before production use.

## Translation decisions
Approved 2026-10-18; see [`i18n.md`](i18n.md#approved-decisions-2026-10-18).

## After translation (approved 2026-10-18)
1. BotID Basic on sign-up (`docs/DEPLOY.md` security checklist)
2. Initial git commit (no secrets: `.env*` stays ignored)
3. **Public** GitHub repository `SCHUGRWS/product-review-system-ai-first-sdd` (portfolio), then push
    - before pushing: a secret scan of every committed file
    - commits use the GitHub `noreply` address, set in this repository's git config only; it can be switched back later for new commits
4. The deployment itself (Vercel, Supabase, OpenAI accounts and keys) is done by the user, following `docs/DEPLOY.md`
