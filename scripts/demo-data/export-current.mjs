// Step 1: export the catalog and the 6 synthetic demo-* accounts (with their
// feedback) from the running local Supabase DB into JSON. Real user accounts
// are never selected. Usage: node scripts/demo-data/export-current.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const DIR = new URL(".", import.meta.url).pathname;
const CONTAINER =
  process.env.DB_CONTAINER ?? "supabase_db_product-review-system-ai-first-sdd";
const DEMO = `a.email ~ '^demo-[a-z]+@example\\.com$'`;

function query(sql) {
  const out = execFileSync(
    "docker",
    [
      "exec",
      CONTAINER,
      "psql",
      "-U",
      "postgres",
      "-At",
      "-c",
      `select coalesce(json_agg(t), '[]') from (${sql}) t`,
    ],
    { maxBuffer: 1 << 28 },
  );
  return JSON.parse(out.toString());
}

const products =
  query(`select id, asin, title, url, image_url, price_cents, list_price_cents,
  discount_percent, currency, rating, review_count, category_slug, category_name,
  first_seen_at, last_seen_at from public.products order by category_slug, asin`);
const accounts =
  query(`select a.id, a.first_name, a.last_name, a.email, a.password, a.salt,
  a.active, a.created_at from public.accounts a where ${DEMO} order by a.email`);
const feedbacks =
  query(`select f.id, f.account_id, f.product_id, f.product_name, f.rating,
  f.comment, f.created_at from public.feedbacks f join public.accounts a on a.id = f.account_id
  where ${DEMO} and f.product_id is not null order by f.created_at, f.id`);

if (accounts.some((a) => !/^demo-[a-z]+@example\.com$/.test(a.email)))
  throw new Error("non-demo account");
const write = (name, data) =>
  writeFileSync(DIR + name, `${JSON.stringify(data, null, 1)}\n`);
write("products.json", products);
write("existing-demo.json", { accounts, feedbacks });
console.log({
  products: products.length,
  accounts: accounts.length,
  feedbacks: feedbacks.length,
});
