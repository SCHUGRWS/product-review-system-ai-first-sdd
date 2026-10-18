# Amazon deals import (n8n + Browserless)

A local n8n workflow fills the `products` table with deals from https://www.amazon.com.br/deals ([`specs/product.md`](../specs/product.md)). Amazon answers plain HTTP with a 503, so n8n asks a local headless Chrome ([Browserless](https://github.com/browserless/browserless)) to render each page and extract the cards, then posts them to the app.

```
Manual run (default) or optional schedule (00:00 America/Sao_Paulo, off by default)
  -> Categories (general page + 22 deal categories)
  -> for each page, one at a time:
       Browserless POST /function (extract-deals.js)  -> Make batches (<= 100)
       -> POST {APP_URL}/api/v1/products/import       -> Record result -> Pause 8 s
  -> Summary (categories, products found / sent / saved / skipped, failures)
```

## Files
| File | What it is |
|---|---|
| `browserless/extract-deals.js` | The Browserless function: opens a page, scrolls, and returns the deal cards. **All scraper selectors are here** |
| `browserless/__fixtures__/deals.html` | Trimmed copy of a rendered deals page (5 cards), used by `e2e/products-extract.spec.ts` |
| `build-workflow.mjs` | Builds the workflow JSON and inlines `extract-deals.js` into it. The category list lives here |
| `workflows/amazon-deals-import.json` | The generated workflow (do not edit by hand; run `pnpm n8n:build`) |
| `../docker-compose.n8n.yml` | n8n `2.43.6` and Browserless `v2.57.1` |

## Setup
1. The app runs on the host at port 3000 (`pnpm dev` or `pnpm start`) with `PRODUCTS_IMPORT_TOKEN` set in `.env.local` (generate one with `openssl rand -base64 32`). n8n reads the same file, so both use the same token. The token is never committed. To import into the deployed app instead, see `APP_URL` below
2. Start n8n and Browserless:
    ```sh
    pnpm n8n:up        # docker compose -f docker-compose.n8n.yml --env-file .env.local up -d
    ```
3. Import the workflow. It is imported **unpublished**, so the Schedule Trigger stays off and the import runs only when you start it (the command restarts n8n so a previously published copy stops too):
    ```sh
    pnpm n8n:import
    ```
4. Open http://localhost:5678, create the local owner account, open "Amazon deals import" and click "Execute workflow". A full run (23 pages) takes about 20 minutes. Run it again whenever you want fresh deals

Run it from the CLI instead of the editor (`N8N_RUNNERS_BROKER_PORT` avoids a clash with the running n8n):
```sh
docker compose -f docker-compose.n8n.yml exec -e N8N_RUNNERS_BROKER_PORT=5690 n8n \
  n8n execute --id AmzDealsImport01
```
Add `-e DEALS_CATEGORIES=tvs,books` to read only some categories (slugs without `deals-collection-`; `deals-all` is the general page).

Stop with `pnpm n8n:down`. The `n8n_data` volume keeps the workflow and its executions.

### Optional daily run
The "Every day at 00:00" Schedule Trigger only fires while the workflow is published:
```sh
pnpm n8n:schedule:on    # n8n publish:workflow --id=AmzDealsImport01, then restarts n8n
pnpm n8n:schedule:off   # n8n unpublish:workflow --id=AmzDealsImport01, then restarts n8n
docker compose -f docker-compose.n8n.yml exec n8n n8n list:workflow --active=true   # lists it while on
```
(Or click **Publish** in the editor.) `pnpm n8n:import` unpublishes it again, so turn it back on after a re-import. n8n must be running at 00:00 for the run to happen.

## Configuration
| Variable | Default | Used for |
|---|---|---|
| `PRODUCTS_IMPORT_TOKEN` | from `.env.local` | `Authorization: Bearer` header of the import requests. The run stops at once when it is missing |
| `APP_URL` | `http://host.docker.internal:3000` | Where the app runs, seen from the n8n container. Local: the default. Deployed: `https://<project>.vercel.app`, with the same `PRODUCTS_IMPORT_TOKEN` set in the Vercel project. Set it in `.env.local` and run `pnpm n8n:up` again |
| `BROWSERLESS_TOKEN` | `local-browserless-token` | Shared by n8n and Browserless (Browserless is not published on a host port) |
| `DEALS_CATEGORIES` | empty (all) | Comma-separated slugs to limit a run |

## Changing the workflow
- Selectors or scrolling: edit `browserless/extract-deals.js`, update the fixture if the page changed, and run the extraction test
- Categories, pause, batch size or nodes: edit `build-workflow.mjs`
- Then `pnpm n8n:build` and `pnpm n8n:import`. `node n8n/build-workflow.mjs --check` fails when the JSON is out of date

Refreshing the fixture: save a rendered deals page from headless Chromium and keep a handful of `[data-testid="product-card"]` elements, without scripts.

## Behaviour and limits
- One page at a time, an 8 s pause between pages, and runs only when started by hand (or at most once a day with the optional schedule). Browserless runs one browser at a time (`CONCURRENT=1`)
- The deals grid is virtualized (cards leave the DOM when scrolled away), so the function collects the cards at each scroll step. It stops after 15 scrolls, 150 products, or 3 steps with nothing new
- A failing page (Browserless error, no cards, import error) is recorded and the loop goes on. The Browserless call is retried once
- The general page is read first, so each product ends up with the category of the last category page that showed it
- The endpoint validates every item and skips incomplete ones (no price, non-Amazon image, bad ASIN) with a reason, shown in the summary
- Scraping goes against Amazon's Conditions of Use. It is accepted here for a local study project at low frequency (see `plans/02-products/execution.md`). The workflow never logs in, adds to the cart, or buys anything
