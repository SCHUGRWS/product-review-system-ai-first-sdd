import { z } from "zod";
import { readJsonBody, toErrorResponse } from "@/app/api/v1/_lib/to-response";
import { importBatchSchema } from "@/features/products/import.schema";
import { importProducts } from "@/server/products/import";
import { isAuthorizedImport } from "@/server/products/import-auth";

// Receives deal batches from the local n8n workflow (specs/product.md).
// Authenticated by a shared Bearer token, not by a user session.
export async function POST(req: Request) {
  if (!isAuthorizedImport(req.headers.get("authorization"))) {
    return Response.json({ error: "Invalid import token" }, { status: 401 });
  }

  const parsed = await readJsonBody(req);
  if ("response" in parsed) return parsed.response;

  const batch = importBatchSchema.safeParse(parsed.body);
  if (!batch.success) {
    return Response.json(
      {
        error: "Invalid import batch",
        fields: z.flattenError(batch.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    return Response.json(await importProducts(batch.data));
  } catch (error) {
    return toErrorResponse(error, "api/v1/products/import");
  }
}
