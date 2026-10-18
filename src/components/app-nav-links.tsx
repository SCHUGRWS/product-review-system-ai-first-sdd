import Link from "next/link";
import { HOME_PATH, ME_PATH } from "@/lib/routes";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: HOME_PATH, label: "Products" },
  { href: ME_PATH, label: "My page" },
] as const;

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
  return (
    <nav aria-label="Main" className={className}>
      <ul className="flex items-center gap-6">
        {LINKS.map(({ href, label }) => {
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
