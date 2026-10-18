# Publishing the project (free tier study)

Researched on 2026-10-17/18 from the official docs listed at the end. Prices and limits change, so check those pages before deploying.

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
- [ ] All secrets as **Sensitive** env vars in Vercel: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `PRODUCTS_IMPORT_TOKEN`, `OPENAI_API_KEY`. Nothing secret under `NEXT_PUBLIC_*`
- [ ] `PRODUCTS_IMPORT_TOKEN`: at least 32 random characters (`openssl rand -base64 32`), different from the local one. The import route answers 401 without it
- [ ] **Vercel Firewall:** the single Hobby rate-limit rule on sign-in / sign-up (e.g. 10 requests per 60 s per IP on `/api/trpc/auth.*` and `/api/v1/sign-*`). The app has no rate limiting of its own, and this also protects the AI cost from mass sign-ups
- [ ] **BotID Basic** (free) on sign-up. This is a code change, not done yet
- [ ] **Deployment Protection:** Standard Protection (Vercel Authentication), so preview deployments are private and only production is public. Password protection is not available on Hobby
- [ ] **OpenAI:** a dedicated project and key, a hard spend limit, auto-recharge off
- [ ] **Supabase:** secret key server-only (already so), RLS on with no policies (already so), SSL enforcement on, MFA on the Supabase, Vercel and GitHub accounts
- [ ] **Backups:** `pg_dump` from time to time (Free has none)
- [ ] **Repository:** public is fine as long as no secrets are committed (`.env*` is gitignored); deployments from forks need your approval

## Step by step
1. **GitHub:** create the repository and push the code (no secrets: check `git status` for `.env.local`).
2. **Supabase:**
    1. Create a Free project in a region close to where the Vercel functions will run (e.g. São Paulo `sa-east-1` for both).
    2. Apply the migrations:
        ```bash
        supabase login
        pnpm db:link --project-ref <project-ref>
        pnpm db:push
        ```
    3. Turn on SSL enforcement, and MFA on the account.
3. **OpenAI:**
    1. Buy the amount you want to spend (minimum $5) and turn off auto-recharge.
    2. Create a project with its own API key and a hard spend limit.
4. **Vercel:**
    1. "Add New Project", import the GitHub repository (Next.js preset).
    2. Set the function region next to Supabase.
    3. Add the env vars from the checklist as Sensitive.
    4. Deploy.
5. **Smoke test:**
    - sign up and sign in
    - `/home` loads (empty until the first import)
    - `curl -X POST https://<project>.vercel.app/api/v1/products/import` returns **401**
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
