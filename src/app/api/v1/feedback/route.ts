import { readJsonBody, toErrorResponse } from "@/app/api/v1/_lib/to-response";
import { createContext } from "@/server/context";
import { createCaller } from "@/server/routers/_app";

// REST entry point for posting feedback. The session cookie authenticates it and
// it runs the same procedure as the tRPC endpoint, so unknown products answer
// 404 (NOT_FOUND) and a second review of the same product 409 (CONFLICT).
export async function POST(req: Request) {
  const parsed = await readJsonBody(req);
  if ("response" in parsed) return parsed.response;

  try {
    const ctx = await createContext({ req, resHeaders: new Headers() });
    const feedback = await createCaller(ctx).feedback.create(
      parsed.body as never,
    );
    return Response.json(
      {
        id: feedback.id,
        product: feedback.product,
        rating: feedback.rating,
        comment: feedback.comment,
        createdAt: feedback.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error, "api/v1/feedback");
  }
}
