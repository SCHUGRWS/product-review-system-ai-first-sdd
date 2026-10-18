import { lang } from "next/root-params";
import { DEFAULT_LOCALE, hasLocale, type Locale } from "./locales";
import { createT } from "./t";

// The request's locale for Server Components and server utilities, read from
// the [lang] root segment (next/root-params), so nothing is prop-drilled and
// pages stay prerendered per language. Not available in Route Handlers or
// Server Actions; the REST API stays English.
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  return hasLocale(value) ? value : DEFAULT_LOCALE;
}

/** Translator for the request's locale */
export async function getT() {
  return createT(await getLocale());
}
