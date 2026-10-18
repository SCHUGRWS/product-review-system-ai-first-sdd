import { TRPCError } from "@trpc/server";
import type { MessageKey } from "@/i18n/dictionaries/en";
import { translate } from "@/i18n/t";

// Attached to a TRPCError so the error formatter can send the message key to
// the UI (translated there), while the message itself stays English for the
// REST API and the logs (specs/i18n.md: REST API messages stay English).
export class MessageKeyCause extends Error {
  constructor(readonly key: MessageKey) {
    super(key);
    this.name = "MessageKeyCause";
  }
}

export function appError(code: TRPCError["code"], key: MessageKey): TRPCError {
  return new TRPCError({
    code,
    message: translate("en", key),
    cause: new MessageKeyCause(key),
  });
}
