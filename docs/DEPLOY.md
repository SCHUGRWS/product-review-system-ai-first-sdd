# Publishing the project (free tier study)

Researched on 2026-10-17/18 from the official docs listed at the end, and updated with what the real deployment needed on 2026-10-18 (live at https://product-review-system-ai-first-sdd.vercel.app: Vercel Hobby in `gru1` São Paulo, Supabase Free in São Paulo). Prices and limits change, so check those pages before deploying.

Placeholders look like `<project-ref>`: replace the whole thing, angle brackets included.

## Verdict
The web app can run **for free** and reasonably securely on **Vercel Hobby + Supabase Free**. Two parts are not "100% free in the cloud":

| Part | Situation | Decision |
|---|---|---|
| **OpenAI** (AI summary) | No free API tier; prepaid credits, $5 minimum. Real usage: about $0.0006 per summary (gpt-4.1-nano), roughly $0.60 to summarize ~1,000 products once, then cents per month | Prepay a fixed amount. When it runs out, the app **stops calling the AI** (circuit breaker) and keeps working: cached summaries still show, new ones say "Summary unavailable right now" |
| **n8n + Browserless** (product import) | Can't run on Vercel: long-running Docker services, while functions stop at 300 s and a full import takes ~10–20 min. n8n Cloud has no free plan; free VM tiers are unreliable for headless Chrome | Keep them **on your machine** and point them at the deployed app. Imports are **manual** (you click "Execute workflow"); the daily schedule is optional |

A home (residential) IP is also the least likely to be blocked by Amazon. Scraping goes against Amazon's Conditions of Use; it's accepted here as a low-frequency, personal study project.

## Chosen setup
```
Your machine                                  Cloud (free)
┌─────────────────────────────┐   HTTPS +    ┌──────────────────────────┐    ┌──────────────────┐
│ n8n + Browserless (Docker)  │ ─ Bearer ──▶ │ Vercel Hobby (Next.js)   │ ─▶ │ Supabase Free    │
│ manual "Execute workflow"   │   token      │ /api/v1/products/import  │    │ Postgres         │
└─────────────────────────────┘              │ pages, tRPC, Mastra ─────┼─▶ OpenAI (prepaid, capped)
                                             └──────────────────────────┘
Browsers load product images directly from m.media-amazon.com (not through Vercel)
```

## Free tier limits that matter
| Service | Limit | Impact here |
|---|---|---|
| **Vercel Hobby** | Personal, non-commercial use only (no ads, no affiliate links) | A study/portfolio project fits |
| | Functions: 300 s max, 2 GB / 1 vCPU; 1M invocations, 4 h Active CPU / month | Plenty; AI calls wait on the network, which isn't Active CPU |
| | Image Optimization: 5,000 transformations / month | **Avoided**: Amazon images are rendered `unoptimized`, so the browser loads the URL directly. Amazon already serves sized variants (`_AC_SF226,226_`, `_FMwebp_`) |
| | Going over a limit pauses the feature; Hobby is never billed | No surprise bills |
| | Runtime logs kept 1 hour, no team members | Fine for a study project |
| **Supabase Free** | 500 MB database, 5 GB egress, 2 projects, **no backups** | Data is small; take manual dumps |
| | **Pauses after 1 week without activity** (restore from the dashboard) | Open the app or run an import at least weekly |
| **OpenAI** | Prepaid; hard spend limits per project | Turn off auto-recharge; the circuit breaker handles "out of credit" |

## Behavior adjusted for this setup
These changes are in [`plans/03-product-reviews/deploy-adjustments.md`](../plans/03-product-reviews/deploy-adjustments.md):
- **AI circuit breaker:** after an OpenAI quota, billing or invalid-key error, the app skips Mastra for `AI_DISABLED_HOURS` (default 6) and logs once, instead of retrying on every visit
- **Manual import:** the n8n schedule ships disabled. Run the workflow when you want fresh deals
- **Catalog doesn't expire between imports:** "available" means seen in the **latest** import (within 3 days of the newest product), not in the last 3 days. A month without imports still shows the last catalog
- **Images straight from Amazon:** no Vercel Image Optimization. `referrerPolicy="no-referrer"`, sizes 1x / 1.5x / 2x from Amazon's own URL tokens

## Security checklist (all available on free plans)
- [x] All secrets as **Sensitive** env vars in Vercel: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `PRODUCTS_IMPORT_TOKEN`, `OPENAI_API_KEY`. Nothing secret under `NEXT_PUBLIC_*`
- [ ] `PRODUCTS_IMPORT_TOKEN`: at least 32 random characters (`openssl rand -base64 32`), different from the local one. The import route answers 401 without it
- [x] **Vercel Firewall:** the single Hobby rate-limit rule on sign-in / sign-up. Rule in use: request path **starts with** `/api/trpc/auth.` **or** starts with `/api/v1/sign-`, **10 requests per 300 s per IP**, action **Deny** (429). Verified on production: 10 × 401 (wrong password), then 429. The app has no rate limiting of its own, and this also protects the AI cost from mass sign-ups
- [x] **BotID Basic** (free) on sign-up: done in code (`src/instrumentation-client.ts`, check in `auth.signUp`). It only runs on Vercel; locally it is skipped
- [ ] **Deployment Protection:** Standard Protection (Vercel Authentication), so preview deployments are private and only production is public. Password protection is not available on Hobby
- [ ] **OpenAI:** a dedicated project and key, a hard spend limit, auto-recharge off
- [x] **Supabase:** secret key server-only, RLS on with no policies (both in the code and migrations)
- [ ] **Supabase:** SSL enforcement on, MFA on the Supabase, Vercel and GitHub accounts
- [ ] **Backups:** `pg_dump` from time to time (Free has none)
- [ ] **Repository:** public is fine as long as no secrets are committed (`.env*` is gitignored); deployments from forks need your approval

## Step by step
1. **GitHub:** create the repository and push the code (no secrets: check `git status` for `.env.local`).
2. **Supabase:**
    1. Create a Free project in a region close to where the Vercel functions will run (e.g. São Paulo `sa-east-1` for both). Options on the creation screen:

        | Option | Choice | Why |
        |---|---|---|
        | Enable Data API | **ON** | `@supabase/supabase-js` talks to the database through it (PostgREST) |
        | Automatically expose new tables | **ON** | The migrations rely on the default grants to `service_role` (the secret key). RLS with no policies still keeps `anon` / `authenticated` out. Turning it off would need explicit `grant`s in a migration |
        | Enable automatic RLS | **ON** | Matches the migrations (every table has RLS on) |
        | Connect GitHub | **Skip** | Migrations are applied with `supabase db push` |

    2. Log in to the CLI. `supabase login` needs an interactive terminal: run it in your own terminal, not through a tool or script without a TTY.
    3. Link the project and apply the migrations (12, including the demo data):
        ```bash
        pnpm db:link --project-ref <project-ref>   # recent CLIs may not ask for the database password
        supabase db push --dry-run                 # lists the migrations it would apply
        supabase db push                           # same as pnpm db:push
        ```
        `<project-ref>` is the id in the dashboard URL (`https://supabase.com/dashboard/project/<project-ref>`).
    4. Turn on SSL enforcement, and MFA on the account.
3. **OpenAI:**
    1. Buy the amount you want to spend (minimum $5) and turn off auto-recharge.
    2. Create a project with its own API key and a hard spend limit.
4. **Vercel:**
    1. "Add New Project", import the GitHub repository (Next.js preset).
    2. Skip the optional "Supabase" integration Vercel offers: it creates a separate, Vercel-managed Supabase project and uses different env var names than this app reads.
    3. Add the env vars as Sensitive:

        | Variable | Value |
        |---|---|
        | `SUPABASE_URL` | Exactly `https://<project-ref>.supabase.co` (Project Settings > API, or Connect). Not the dashboard URL, not a leftover placeholder |
        | `SUPABASE_SECRET_KEY` | The **Secret** key, `sb_secret_...` (Project Settings > API Keys). Not the publishable key (`sb_publishable_...`) |
        | `PRODUCTS_IMPORT_TOKEN` | `openssl rand -base64 32`, different from the local one |
        | `OPENAI_API_KEY` | Key of the dedicated OpenAI project |

        A wrong `SUPABASE_URL` shows up as `getaddrinfo ENOTFOUND` in the runtime logs, and sign-in answers 500.
    4. Settings > Functions > Function Region: **São Paulo (gru1)**, next to Supabase.
    5. Deploy. Env var changes only apply to new deployments: after changing one, use **Redeploy** on the latest deployment.
5. **Smoke test:** see [Production smoke test](#production-smoke-test) below.
6. **First import from your machine:**
    1. In `.env.local` set `APP_URL=https://<project>.vercel.app` and the **production** `PRODUCTS_IMPORT_TOKEN`.
    2. Run `pnpm n8n:up` and `pnpm n8n:import`.
    3. Open http://localhost:5678 and click "Execute workflow" (see [`n8n/README.md`](../n8n/README.md)).
    4. Switch `APP_URL` back to `http://host.docker.internal:3000` to import into your local app again.
7. **Security:** add the Firewall rate-limit rule and turn on Standard Deployment Protection.
8. **AI summary:** open a product with 3+ reviews and check that the summary appears and that a row shows up in `product_feedback_summaries`.
9. **Routine:**
    - run an import (or just open the app) at least once a week, so Supabase doesn't pause
    - `pg_dump` now and then
    - check the OpenAI balance; when it's gone the summaries freeze until you add credit

## Production smoke test
Run after the first deploy and after env var changes. `<app>` is the deployment URL, e.g. `https://<project>.vercel.app`.
- Pages answer **200** in both locales: `/en`, `/pt-BR`, `/en/auth/sign-in`, `/pt-BR/auth/sign-in`
- `/home` without a locale **redirects** (307) to `/en/home` or `/pt-BR/home` (cookie or browser language)
- The token-protected routes answer **401** without a token:
    ```bash
    curl -s -o /dev/null -w "%{http_code}\n" -X POST <app>/api/v1/products/import
    curl -s -o /dev/null -w "%{http_code}\n" -X POST <app>/api/v1/summaries/warm
    ```
- Sign in with the demo account (`demo@example.com` / `demo-review-2026`): `/home` shows the catalog and the "Most reviewed here" row
- A product with 3+ reviews (any card in "Most reviewed here") shows the **AI summary** in English and, on the `/pt-BR/...` URL, in Portuguese; `product_feedback_summaries` gets a row per language
- Optional: 11 quick wrong-password sign-ins return 401 ten times, then **429** (firewall rule)

## Alternatives considered
| Option | Cost | Why not chosen |
|---|---|---|
| Import with GitHub Actions + Playwright, Gemini free tier for the summary | $0 | Amazon likely blocks GitHub's datacenter IPs; scheduled workflows are disabled after 60 days without activity on public repos; Gemini's free tier uses your content to improve Google's products; needs the n8n flow rewritten |
| Vercel Cron (one route per page) + hosted Browserless free tier | $0 (or $5 with OpenAI) | Browserless free gives 1,000 units/month (≈ the whole quota for one daily run); datacenter IP blocking; cron runs drift within the hour; 23 routes to secure |
| n8n on Oracle Cloud Always Free | $0 (needs a card) | Idle VMs can be reclaimed, and n8n is idle most of the time |
| n8n Cloud | from €20/month | Not free |

## Sources
- Vercel: [Hobby plan](https://vercel.com/docs/plans/hobby), [fair use](https://vercel.com/docs/limits/fair-use-guidelines), [function limits](https://vercel.com/docs/functions/limitations), [image optimization limits](https://vercel.com/docs/image-optimization/limits-and-pricing), [cron usage](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs), [routing middleware](https://vercel.com/docs/routing-middleware), [WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting), [BotID](https://vercel.com/docs/botid), [deployment protection](https://vercel.com/docs/deployment-protection), [sensitive env vars](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
- Supabase: [pricing](https://supabase.com/pricing), [going into production](https://supabase.com/docs/guides/deployment/going-into-prod), [network restrictions](https://supabase.com/docs/guides/platform/network-restrictions)
- OpenAI: [pricing](https://developers.openai.com/api/docs/pricing), [prepaid billing](https://help.openai.com/en/articles/8264644-setting-up-and-managing-prepaid-api-billing), [spend limits](https://developers.openai.com/api/docs/guides/spend-limits)
- Others: [n8n pricing](https://n8n.io/pricing/), [Browserless pricing](https://www.browserless.io/pricing), [Mastra in web frameworks](https://mastra.ai/docs/deployment/web-framework), [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing), [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [Oracle Always Free](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
