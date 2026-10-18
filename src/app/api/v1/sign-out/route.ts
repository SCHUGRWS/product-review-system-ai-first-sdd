import { toErrorResponse } from "@/app/api/v1/_lib/to-response";
import { createContext } from "@/server/context";
import { createCaller } from "@/server/routers/_app";

// REST entry point for sign-out. No body is needed: the session comes from the
// cookie. Succeeds without a session too, and always clears the cookie.
export async function POST(req: Request) {
  const resHeaders = new Headers();
  try {
    const ctx = await createContext({ req, resHeaders });
    const result = await createCaller(ctx).auth.signOut();
    return Response.json(result, { status: 200, headers: resHeaders });
  } catch (error) {
    return toErrorResponse(error, "api/v1/sign-out");
  }
}
