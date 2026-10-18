import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { nanoid } from "nanoid";
import { getDb } from "@/server/db";
import { SESSION_TTL_SECONDS, type SessionUser } from "./types";

type SessionRow = {
  expires_at: string;
  accounts: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    active: boolean;
    created_at: string;
  } | null;
};

// 32 random bytes: 43 characters of base64url, sent to the browser only.
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

// Only this hash is stored, so a leaked sessions table can't be replayed.
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  accountId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + SESSION_TTL_SECONDS * 1000);

  const { error } = await getDb()
    .from("sessions")
    .insert({
      id: nanoid(),
      account_id: accountId,
      token_hash: hashSessionToken(token),
      created_at: createdAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    });
  if (error) {
    throw new Error(`Could not create the session: ${error.message}`);
  }

  return { token, expiresAt };
}

// Returns the account behind a valid session, or null when the session is
// missing, expired, or belongs to an inactive account. One query (join).
export async function getSessionUser(
  token: string,
): Promise<SessionUser | null> {
  const now = new Date();
  const { data, error } = await getDb()
    .from("sessions")
    .select(
      "expires_at, accounts!inner(id, first_name, last_name, email, active, created_at)",
    )
    .eq("token_hash", hashSessionToken(token))
    .gt("expires_at", now.toISOString())
    .eq("accounts.active", true)
    .maybeSingle<SessionRow>();

  if (error) {
    console.error("[auth] failed to read the session", error.message);
    return null;
  }
  // The query already filters these; checked again so a stale row never authenticates
  const account = data?.accounts;
  if (!data || !account || !account.active) return null;
  if (new Date(data.expires_at).getTime() <= now.getTime()) return null;

  return {
    id: account.id,
    firstName: account.first_name,
    lastName: account.last_name,
    email: account.email,
    createdAt: new Date(account.created_at),
  };
}

export async function deleteSession(token: string): Promise<void> {
  const { error } = await getDb()
    .from("sessions")
    .delete()
    .eq("token_hash", hashSessionToken(token));
  if (error) {
    throw new Error(`Could not delete the session: ${error.message}`);
  }
}
