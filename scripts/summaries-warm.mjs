// Fills missing or stale AI summaries through POST /api/v1/summaries/warm.
//
//   pnpm summaries:warm [--limit=50] [--locale=en|pt-BR] [--all]
//
// The app must be running (pnpm dev or pnpm start). Token: PRODUCTS_IMPORT_TOKEN
// from the environment, else from .env.local. Target: APP_URL from the shell
// environment, else http://localhost:3000 (the APP_URL in .env.local is the one
// n8n uses from Docker, so it is not read here). --all repeats the call until
// nothing is left or the run stops early (AI breaker, no key).
import { readFileSync } from "node:fs";

function fromEnvFile(name) {
  try {
    const text = readFileSync(
      new URL("../.env.local", import.meta.url),
      "utf8",
    );
    const line = text
      .split(/\r?\n/)
      .find((l) => l.trim().startsWith(`${name}=`));
    if (!line) return undefined;
    return line
      .slice(line.indexOf("=") + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, "$2");
  } catch {
    return undefined;
  }
}

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, "").split("=");
    return [key, value ?? true];
  }),
);
const token =
  process.env.PRODUCTS_IMPORT_TOKEN || fromEnvFile("PRODUCTS_IMPORT_TOKEN");
if (!token) {
  console.error("PRODUCTS_IMPORT_TOKEN is not set (env or .env.local)");
  process.exit(1);
}
const base = (process.env.APP_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);
const body = {};
if (args.limit) body.limit = Number(args.limit);
if (args.locale) body.locale = args.locale;

const total = { checked: 0, generated: 0, skipped: 0, failed: 0 };
for (let round = 1; ; round++) {
  const res = await fetch(`${base}/api/v1/summaries/warm`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`Warm-up failed (${res.status})`, result);
    process.exit(1);
  }
  console.log(`Round ${round}:`, result);
  if (round === 1) total.checked = result.checked;
  total.generated += result.generated;
  total.failed += result.failed;
  // Stop when done, when the server stopped for a reason other than time,
  // or when a round made no progress (only failures left)
  if (!args.all || result.remaining === 0) break;
  if (result.stopped && result.stopped !== "time") break;
  if (result.generated === 0) break;
}
if (args.all) console.log("Total:", total);
