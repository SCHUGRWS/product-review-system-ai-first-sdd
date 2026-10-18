import { readSessionToken } from "@/server/auth/cookie";
import { getSessionUser } from "@/server/auth/session";
import type { SessionUser } from "@/server/auth/types";

export type Context = {
  user: SessionUser | null;
  sessionToken: string | null;
  /** Response headers; procedures append Set-Cookie here */
  resHeaders: Headers;
};

// Builds the tRPC context from the request cookie. Used by the tRPC endpoint and the REST routes.
export async function createContext({
  req,
  resHeaders,
}: {
  req: Request;
  resHeaders: Headers;
}): Promise<Context> {
  const sessionToken = readSessionToken(req.headers.get("cookie"));
  const user = sessionToken ? await getSessionUser(sessionToken) : null;
  // The raw token is kept even when invalid, so sign-out can delete expired rows
  return { user, sessionToken, resHeaders };
}
