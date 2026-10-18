import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { ZodError, z } from "zod";
import { translateMessage } from "@/i18n/t";
import { VALIDATION_MESSAGE } from "@/server/trpc";

// Shared helpers for the REST routes in /api/v1, which run the same tRPC
// procedures as the tRPC endpoint and map their errors to JSON responses.

/** Parses the JSON body, or returns the 400 response to send back. */
export async function readJsonBody(
  req: Request,
): Promise<{ body: unknown } | { response: Response }> {
  try {
    return { body: await req.json() };
  } catch {
    return {
      response: Response.json(
        { error: "Request body must be valid JSON" },
        { status: 400 },
      ),
    };
  }
}

/** Maps a thrown error to a JSON error response with the matching status. */
export function toErrorResponse(
  error: unknown,
  route: string,
  headers?: Headers,
): Response {
  if (error instanceof TRPCError) {
    const status = getHTTPStatusCodeFromError(error);
    if (error.cause instanceof ZodError) {
      return Response.json(
        {
          error: VALIDATION_MESSAGE,
          // The schemas carry message keys; the REST API answers in English
          fields: englishFieldErrors(z.flattenError(error.cause).fieldErrors),
        },
        { status, headers },
      );
    }
    return Response.json({ error: error.message }, { status, headers });
  }
  console.error(`[${route}] unexpected error`, error);
  return Response.json(
    { error: "Internal server error" },
    { status: 500, headers },
  );
}

function englishFieldErrors(
  fields: Record<string, string[] | undefined>,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [field, messages] of Object.entries(fields)) {
    if (messages)
      result[field] = messages.map((m) => translateMessage("en", m));
  }
  return result;
}
