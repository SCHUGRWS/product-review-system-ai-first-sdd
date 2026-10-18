import { type NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE, pickLocale } from "@/i18n/locales";
import { localeHref, pathnameLocale } from "@/lib/routes";

// Every page lives under /<locale>/ (specs/i18n.md). A URL without one
// (old links, bookmarks, "/") is redirected, keeping the query string, to the
// locale from the prs_locale cookie, then the browser's Accept-Language, then
// English. API routes, Next.js internals and static files are never touched.

// BotID's challenge script is served under this prefix (next.config.ts rewrites)
const BOTID_PREFIX = "/149e9513-01fa-4fb0-aad4-566afd725d1b";

export function isLocalizable(pathname: string) {
  if (pathname === "/api" || pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname.startsWith(BOTID_PREFIX)) return false;
  // Static files: favicon.ico, robots.txt, images in public/
  const last = pathname.split("/").pop() ?? "";
  return !last.includes(".");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isLocalizable(pathname) || pathnameLocale(pathname)) {
    return NextResponse.next();
  }
  const locale = pickLocale(
    request.cookies.get(LOCALE_COOKIE)?.value,
    request.headers.get("accept-language"),
  );
  const url = request.nextUrl.clone();
  url.pathname = localeHref(locale, pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Same exclusions as isLocalizable, so the proxy does not even run for them
  matcher: [
    "/((?!api/|_next/|149e9513-01fa-4fb0-aad4-566afd725d1b/|.*\\..*).*)",
  ],
};
