import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Typed from the generated schema (src/types/database.ts, `pnpm db:types`)
export type Db = SupabaseClient<Database>;

let client: Db | undefined;

// Server-side Supabase client with elevated access (bypasses RLS).
// Works with local (`supabase start`) or hosted projects; only env vars change.
// Never import this from client components.
export function getDb(): Db {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    // Hosted projects issue `sb_secret_...` keys; the legacy service_role JWT also works
    const key =
      process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) must be set",
      );
    }
    client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
