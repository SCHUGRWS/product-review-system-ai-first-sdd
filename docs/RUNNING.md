# Running the project locally (step by step)

Everything runs on your machine: the database (Supabase in Docker), the app (Next.js on port 3000) and the product import (n8n + Browserless in Docker). Run the commands from the project folder.

| Service | Address | Started by |
|---|---|---|
| App | http://localhost:3000 | `pnpm dev` |
| Supabase Studio (database UI) | http://localhost:54323 | `pnpm db:start` |
| n8n | http://localhost:5678 | `pnpm n8n:up` |

## 1. First time only

1. Install the requirements: Node.js 24+, pnpm, Docker, and the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).
2. Install the dependencies:
    ```bash
    pnpm install
    ```
3. Start the database. The first run downloads the images and applies every migration:
    ```bash
    pnpm db:start
    ```
4. Create the env file and fill it in:
    ```bash
    cp .env.example .env.local
    ```
    - `SUPABASE_SECRET_KEY`: the "Secret" key shown by `supabase status`
    - `PRODUCTS_IMPORT_TOKEN`: any long random value, e.g. the output of `openssl rand -base64 32`
5. Start the app (step 2.3 below), then n8n, and import the workflow:
    ```bash
    pnpm n8n:up
    pnpm n8n:import     # imports the workflow unpublished: manual runs only, no daily schedule
    ```
    n8n sends the products to `APP_URL`, `http://host.docker.internal:3000` by default (this app). To import into the deployed app instead, set `APP_URL=https://<project>.vercel.app` in `.env.local`, use the same `PRODUCTS_IMPORT_TOKEN` as in Vercel, and restart n8n with `pnpm n8n:up`.
6. Open http://localhost:5678 and create the local n8n owner account (asked only once).
7. First product load: in n8n, open "Amazon deals import" and click **Execute workflow**. The catalog is empty until this runs. A full run takes about 20 minutes, and products appear on `/home` as each category finishes. Run it again whenever you want fresh deals; for an automatic run every day at 00:00 while n8n is up, run `pnpm n8n:schedule:on` (and `pnpm n8n:schedule:off` to stop it).

## 2. Every time (after a restart)

Docker containers don't come back by themselves after the computer or WSL restarts. Start them in this order:

1. Make sure Docker is running:
    ```bash
    docker info --format '{{.ServerVersion}}'    # prints a version; an error means Docker is off
    ```
2. Database, then any new migrations (keeps your data):
    ```bash
    pnpm db:start
    supabase migration up --local
    ```
3. App (leave this terminal open):
    ```bash
    pnpm dev
    ```
4. n8n and Browserless, in another terminal. Only needed for the product import; the app works without it:
    ```bash
    pnpm n8n:up
    ```
    The workflow stays saved, so there is no need to import it again. Re-import only after changing the workflow (`pnpm n8n:build && pnpm n8n:import`); importing unpublishes it, so run `pnpm n8n:schedule:on` again if you use the daily run.

## 3. Check that it works

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/          # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5678/healthz   # 200
docker exec supabase_db_product-review-system-ai-first-sdd \
  psql -U postgres -tAc "select count(*) from products"                 # number of products
```

Then open http://localhost:3000, create an account, sign in, search for a product on `/home` and post a feedback.

## 4. Stopping

```bash
# Ctrl+C in the terminal running `pnpm dev`
pnpm n8n:down     # stops n8n and Browserless; the workflow stays saved in the n8n_data volume
pnpm db:stop      # stops Supabase; data is kept
```

Leave n8n running if you turned on the daily 00:00 import (`pnpm n8n:schedule:on`).

## 5. Running the tests

```bash
pnpm lint && pnpm typecheck && pnpm test   # no services needed
pnpm test:e2e                              # needs the database running; builds and starts the app itself
pnpm db:test                               # SQL tests (pgTAP) on the local database, rolled back
```
If `pnpm dev` is running on port 3000, the E2E run reuses it instead of building. To test the production build, stop the dev server first. On WSL or a bare Linux, Chromium may need system libraries once: `sudo pnpm exec playwright install-deps chromium`.

## Troubleshooting

| Problem | Fix |
|---|---|
| `Port 3000 is in use` | Another `pnpm dev`/`pnpm start` is running. Stop it, or find it with `ss -ltnp \| grep :3000` |
| App errors about `SUPABASE_URL` / `SUPABASE_SECRET_KEY` | `.env.local` is missing or the key changed: copy the "Secret" key from `supabase status` |
| Database errors about missing tables/columns | Run `supabase migration up --local` |
| `pnpm n8n:up` fails | `.env.local` must exist (the compose file reads the token from it) and Docker must be running |
| Import runs but nothing is saved | Check that the app is running on port 3000 and that `PRODUCTS_IMPORT_TOKEN` is the same in `.env.local` for both (restart `pnpm dev` and `pnpm n8n:up` after changing it) |
| Pages extract 0 products | Amazon may have changed its HTML or blocked the request. See "Changing the workflow" in [`n8n/README.md`](../n8n/README.md) |
| `/home` is empty | No import has run yet. Lists show the products of the latest import (seen within 3 days before it), so an old import still shows. Run the workflow manually |
| AI summary says "Summary unavailable right now" | `OPENAI_API_KEY` is missing, or the AI breaker is open after a quota, billing or invalid-key error (the server log says "AI disabled until ..."). It retries after `AI_DISABLED_HOURS` (default 6); to retry now, clear the flag: `docker exec supabase_db_product-review-system-ai-first-sdd psql -U postgres -c "update app_flags set ai_disabled_until = null"` |
