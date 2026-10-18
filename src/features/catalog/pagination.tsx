import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getT } from "@/i18n/server";
import { cn } from "@/lib/utils";
import { pageCount, pageLinks } from "./page-links";

const ITEM =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-md px-3 text-[0.9375rem] font-semibold tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt";

export async function Pagination({
  total,
  page,
  pageSize,
  href,
}: {
  total: number;
  page: number;
  pageSize: number;
  href: (page: number) => string;
}) {
  const links = pageLinks(total, page, pageSize);
  if (links.length === 0) return null;
  const t = await getT();
  const last = pageCount(total, pageSize);

  return (
    <nav
      aria-label={t("pagination.label")}
      className="mt-12 flex justify-center"
    >
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        <li>
          <StepLink
            href={page > 1 ? href(page - 1) : null}
            label={t("pagination.previous")}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </StepLink>
        </li>
        {links.map((link) =>
          link.type === "gap" ? (
            <li key={link.key} aria-hidden="true" className="px-1 text-slate">
              …
            </li>
          ) : (
            <li key={link.page}>
              <Link
                href={href(link.page)}
                aria-current={link.current ? "page" : undefined}
                aria-label={t("pagination.page", { page: link.page })}
                className={cn(
                  ITEM,
                  link.current
                    ? "bg-cobalt text-paper shadow-[0_6px_14px_rgb(30_49_176/0.28)]"
                    : "text-ink hover:bg-mist hover:text-cobalt",
                )}
              >
                {link.page}
              </Link>
            </li>
          ),
        )}
        <li>
          <StepLink
            href={page < last ? href(page + 1) : null}
            label={t("pagination.next")}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </StepLink>
        </li>
      </ul>
    </nav>
  );
}

function StepLink({
  href,
  label,
  children,
}: {
  href: string | null;
  label: string;
  children: React.ReactNode;
}) {
  if (!href) {
    return (
      <span aria-hidden="true" className={cn(ITEM, "text-rule")}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(ITEM, "text-cobalt hover:bg-mist")}
    >
      {children}
    </Link>
  );
}
