// Supported UI languages (specs/i18n.md). Every page lives under /<locale>/.
export const LOCALES = ["en", "pt-BR"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

// Set when a signed-in user picks a language (and at sign-in from the
// account); the proxy reads it to redirect URLs without a locale.
export const LOCALE_COOKIE = "prs_locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Language names written in their own language, for the profile switch */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Português",
};

export function hasLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.includes(value as Locale);
}

// "pt", "pt-BR", "pt-PT" -> pt-BR; "en", "en-US" -> en; anything else -> null
function matchTag(tag: string): Locale | null {
  const base = tag.trim().toLowerCase().split("-")[0];
  if (base === "pt") return "pt-BR";
  if (base === "en") return "en";
  return null;
}

/** The best supported locale of an Accept-Language header, by q weight */
export function localeFromAcceptLanguage(
  header: string | null | undefined,
): Locale | null {
  if (!header) return null;
  const ranges = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="))
        ?.slice(2);
      const weight = q === undefined ? 1 : Number(q);
      return { tag, weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((range) => range.tag && range.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  for (const range of ranges) {
    const locale = matchTag(range.tag);
    if (locale) return locale;
  }
  return null;
}

/** Locale for a request without one in the URL: cookie, then browser, then en */
export function pickLocale(
  cookie: string | null | undefined,
  acceptLanguage: string | null | undefined,
): Locale {
  if (hasLocale(cookie)) return cookie;
  return localeFromAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE;
}
