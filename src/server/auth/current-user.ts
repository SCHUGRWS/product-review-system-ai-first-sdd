import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getSessionUser } from "./session";
import { SESSION_COOKIE, type SessionUser } from "./types";

// Data Access Layer for Server Components. Reads the session cookie, so callers
// must sit behind a <Suspense> boundary (Cache Components).

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  // Expiry is checked against the current time, so the lookup must run at
  // request time, never in a (runtime) prerender
  await connection();
  return getSessionUser(token);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in");
  return user;
}
