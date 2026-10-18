import { createClient } from "@supabase/supabase-js";

// Removes what the E2E run created, so fixture products and test accounts don't
// linger in the local catalog. Deleting accounts cascades to sessions and feedback.
export default async function globalTeardown() {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  const db = createClient(url, key, { auth: { persistSession: false } });
  const accounts = await db
    .from("accounts")
    .delete()
    .like("email", "e2e-%@example.com");
  if (accounts.error) throw accounts.error;
  const products = await db.from("products").delete().like("asin", "E2E%");
  if (products.error) throw products.error;
}
