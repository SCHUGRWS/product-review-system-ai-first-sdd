import { dictionaries, isMessageKey } from "./dictionaries";
import type { Locale } from "./locales";
import { formatMessage, type T, VALIDATION_VARS } from "./message";

export type { MessageKey } from "./dictionaries/en";
export type { MessageVars, T } from "./message";

/** A translator bound to one locale (server side; see ./server.ts for the request's) */
export function createT(locale: Locale): T {
  const dictionary = dictionaries[locale];
  return (key, vars) => formatMessage(dictionary[key], vars);
}

/** One message in one locale */
export function translate(
  locale: Locale,
  ...args: Parameters<T>
): ReturnType<T> {
  return createT(locale)(...args);
}

/**
 * A message that may be a key (zod messages and tRPC errors carry keys):
 * translated when it is one, returned unchanged otherwise.
 */
export function translateMessage(locale: Locale, message: string): string {
  return isMessageKey(message)
    ? formatMessage(dictionaries[locale][message], VALIDATION_VARS)
    : message;
}
