"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useLocale } from "@/i18n/client";
import { localeHref } from "@/lib/routes";

// next/link with the current locale prefixed ("/home" -> "/pt-BR/home"), for
// components that render on both sides. Server Components use localeHref.
export function LocalizedLink({
  href,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const locale = useLocale();
  return <Link href={localeHref(locale, href)} {...props} />;
}
