import type { MessageKey } from "./dictionaries/en";
import type { T } from "./message";

type ErrorWithKey = { data?: { messageKey?: string | null } | null };

// tRPC errors carry a message key (src/server/errors.ts); the client shows it
// in the UI language. Errors without one (network, unexpected) get a generic line.
export function errorMessage(t: T, error: ErrorWithKey): string {
  const key = error.data?.messageKey;
  return key?.startsWith("errors.")
    ? t(key as MessageKey)
    : t("errors.generic");
}
