import type { Locale } from "../locales";
import { en, type MessageKey, type Messages } from "./en";
import { ptBR } from "./pt-BR";

// Both dictionaries. Imported by server code only: client components get the
// subset they need through <I18nProvider> (src/i18n/client.tsx).
export const dictionaries: Record<Locale, Messages> = { en, "pt-BR": ptBR };

export function getDictionary(locale: Locale): Messages {
  return dictionaries[locale];
}

export function isMessageKey(value: unknown): value is MessageKey {
  return typeof value === "string" && Object.hasOwn(en, value);
}

/**
 * Messages whose key starts with one of the prefixes ("auth.", or a full key
 * such as "reviews.seeAllReviews"), for the client provider.
 */
export function pickMessages(
  locale: Locale,
  prefixes: readonly string[],
): Partial<Messages> {
  const dictionary = dictionaries[locale];
  const picked: Partial<Messages> = {};
  for (const key of Object.keys(dictionary) as MessageKey[]) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      picked[key] = dictionary[key];
    }
  }
  return picked;
}

export type { MessageKey, Messages };
