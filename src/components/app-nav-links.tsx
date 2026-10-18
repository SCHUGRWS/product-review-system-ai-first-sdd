"use client";

import Link from "next/link";
import { useLocale, useT } from "@/i18n/client";
import { homeHref, meHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

// The nav markup without reading the URL, so header skeletons can render it in
// the static shell of dynamic routes (/products/[productId]); AppNav adds the
// current page on the client.
export function AppNavLinks({
  current,
  className,
}: {
  current?: string;
  className?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const links = [
    { href: homeHref(locale), label: t("nav.products") },
    { href: meHref(locale), label: t("nav.me") },
  ];
  return (
    <nav aria-label={t("nav.label")} className={className}>
      <ul className="flex items-center gap-6">
        {links.map(({ href, label }) => {
          const isCurrent = current === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex h-10 items-center sm:h-16 border-b-2 text-[0.9375rem] font-semibold transition-colors focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt",
                  isCurrent
                    ? "border-cobalt text-ink"
                    : "border-transparent text-slate hover:text-cobalt",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
