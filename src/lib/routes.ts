import { hasLocale, type Locale } from "@/i18n/locales";

// Paths without the locale; every link goes through localeHref (or a helper
// below), so no page links to an un-prefixed URL (src/lib/no-hardcoded-routes.test.ts).
export const LANDING_PATH = "/";
export const HOME_PATH = "/home";
export const ME_PATH = "/me";
export const SIGN_IN_PATH = "/auth/sign-in";
export const SIGN_UP_PATH = "/auth/sign-up";
export const SIGN_UP_SUCCESS_PATH = "/auth/sign-up/success";

/** "/home" -> "/pt-BR/home"; "/" -> "/pt-BR" */
export function localeHref(locale: Locale, path: string) {
  if (path === "/" || path === "") return `/${locale}`;
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

/** The locale a pathname starts with, or null ("/pt-BR/home" -> "pt-BR") */
export function pathnameLocale(pathname: string): Locale | null {
  const segment = pathname.split("/")[1];
  return hasLocale(segment) ? segment : null;
}

/** The same page in another locale ("/en/me" -> "/pt-BR/me") */
export function switchLocaleHref(pathname: string, locale: Locale) {
  const current = pathnameLocale(pathname);
  const rest = current ? pathname.slice(current.length + 1) : pathname;
  return localeHref(locale, rest || "/");
}

export function homeHref(locale: Locale) {
  return localeHref(locale, HOME_PATH);
}

export function meHref(locale: Locale) {
  return localeHref(locale, ME_PATH);
}

export function signInHref(locale: Locale) {
  return localeHref(locale, SIGN_IN_PATH);
}

export function productFeedbackHref(locale: Locale, productId: string) {
  return localeHref(
    locale,
    `/products/${encodeURIComponent(productId)}/feedback`,
  );
}

export function productReviewsHref(locale: Locale, productId: string) {
  return localeHref(locale, `/products/${encodeURIComponent(productId)}`);
}
