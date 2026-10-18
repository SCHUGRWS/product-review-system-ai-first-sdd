import { readJsonBody, toErrorResponse } from "@/app/api/v1/_lib/to-response";
import { createContext } from "@/server/context";
import { createCaller } from "@/server/routers/_app";

// REST entry point for sign-in. It runs the same procedure as the tRPC endpoint
// and forwards the session cookie the procedure sets.
export async function POST(req: Request) {
  const parsed = await readJsonBody(req);
  if ("response" in parsed) return parsed.response;

  const resHeaders = new Headers();
  try {
    const ctx = await createContext({ req, resHeaders });
    const user = await createCaller(ctx).auth.signIn(parsed.body as never);
    return Response.json(user, { status: 200, headers: resHeaders });
  } catch (error) {
    return toErrorResponse(error, "api/v1/sign-in");
  }
}
