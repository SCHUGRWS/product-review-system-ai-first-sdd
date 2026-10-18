import "server-only";
import { getDb } from "@/server/db";

// Circuit breaker for the AI summary (specs/product-reviews.md, 4.8). When the
// prepaid OpenAI credit runs out, or the key is rejected, the server records
// "AI disabled until" in public.app_flags and skips the model until then,
// instead of failing on every visit. Kept in the database because Vercel
// functions do not share memory.

export const DEFAULT_AI_DISABLED_HOURS = 6;
const TABLE = "app_flags";

/** Hours the AI stays off after a trip: AI_DISABLED_HOURS, default 6 */
export function aiDisabledHours(
  env: Record<string, string | undefined> = process.env,
) {
  const hours = Number(env.AI_DISABLED_HOURS);
  return Number.isFinite(hours) && hours > 0
    ? hours
    : DEFAULT_AI_DISABLED_HOURS;
}

/** Error codes OpenAI sends when the account cannot pay for more calls */
const BILLING_CODES = ["insufficient_quota", "billing_hard_limit_reached"];

type ErrorLike = {
  statusCode?: unknown;
  status?: unknown;
  responseBody?: unknown;
  data?: unknown;
  code?: unknown;
  type?: unknown;
  message?: unknown;
  cause?: unknown;
  lastError?: unknown;
  errors?: unknown;
};

/** The error and the errors it wraps (cause, RetryError.lastError/errors) */
function* chain(error: unknown, depth = 0): Generator<ErrorLike> {
  if (depth > 5 || error === null || typeof error !== "object") return;
  const e = error as ErrorLike;
  yield e;
  yield* chain(e.cause, depth + 1);
  yield* chain(e.lastError, depth + 1);
  if (Array.isArray(e.errors)) {
    for (const inner of e.errors) yield* chain(inner, depth + 1);
  }
}

function text(value: unknown) {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function parse(value: unknown) {
  if (typeof value !== "string") return undefined;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

/** { error: { code, type } } from an OpenAI error body */
function openAiError(value: unknown) {
  if (value === null || typeof value !== "object") return undefined;
  const error = (value as { error?: unknown }).error;
  if (error === null || typeof error !== "object") return undefined;
  return error as { code?: unknown; type?: unknown };
}

/**
 * Why an AI call failed for good, or null for errors worth retrying on the
 * next visit (timeouts, rate limits, 5xx). Mastra 1.73 throws the AI SDK's
 * APICallError as is: { statusCode, responseBody (raw JSON text), data:
 * { error: { code, type, message } } }. Quota and billing come back as 429
 * (or 400) with code insufficient_quota / billing_hard_limit_reached; a bad
 * key is 401; a model the project does not allow is 403/404 model_not_found.
 */
export function aiOutageReason(error: unknown): string | null {
  for (const e of chain(error)) {
    const status = Number(e.statusCode ?? e.status);
    const body = openAiError(e.data) ?? openAiError(parse(e.responseBody));
    // Codes first, then types ("insufficient_quota" is also a type), then
    // any raw text, for shapes this does not know yet
    const details = [
      e.code,
      body?.code,
      e.type,
      body?.type,
      e.responseBody,
      e.data,
    ].map((value) => text(value).toLowerCase());
    for (const detail of details) {
      const billing = BILLING_CODES.find((code) => detail.includes(code));
      if (billing) return billing;
    }
    if (status === 401) return "invalid_api_key";
    // The OpenAI project does not allow the configured model: a settings
    // problem that won't fix itself on the next visit
    if (status === 403 || status === 404) {
      if (body?.code === "model_not_found") return "model_not_found";
    }
  }
  return null;
}

type FlagRow = { ai_disabled_until: string | null };

/** Until when the AI is off, or null when it is on (also on read errors) */
export async function readAiDisabledUntil(): Promise<Date | null> {
  try {
    const { data, error } = await getDb()
      .from(TABLE)
      .select("ai_disabled_until")
      .eq("id", true)
      .maybeSingle();
    if (error) throw error;
    const until = (data as FlagRow | null)?.ai_disabled_until;
    return until ? new Date(until) : null;
  } catch (error) {
    console.error("[summary] failed to read the AI flag", error);
    return null;
  }
}

/** Turns the AI off for aiDisabledHours() and logs it once */
export async function tripAiBreaker(reason: string, now = new Date()) {
  const until = new Date(now.getTime() + aiDisabledHours() * 3_600_000);
  console.error(
    `[summary] AI disabled until ${until.toISOString()} (${reason}); cached summaries still show`,
  );
  try {
    const { error } = await getDb().from(TABLE).upsert(
      {
        id: true,
        ai_disabled_until: until.toISOString(),
        ai_disabled_reason: reason,
        updated_at: now.toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) throw error;
  } catch (error) {
    console.error("[summary] failed to store the AI flag", error);
  }
  return until;
}
