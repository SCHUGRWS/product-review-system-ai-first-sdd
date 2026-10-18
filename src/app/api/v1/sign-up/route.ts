import { readJsonBody, toErrorResponse } from "@/app/api/v1/_lib/to-response";
import { createContext } from "@/server/context";
import { createCaller } from "@/server/routers/_app";

// REST entry point for sign-up. It runs the same procedure as the tRPC endpoint.
export async function POST(req: Request) {
  const parsed = await readJsonBody(req);
  if ("response" in parsed) return parsed.response;

  try {
    const ctx = await createContext({ req, resHeaders: new Headers() });
    const account = await createCaller(ctx).auth.signUp(parsed.body as never);
    return Response.json(account, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "api/v1/sign-up");
  }
}
