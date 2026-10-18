import Link from "next/link";
import { SignOutButton } from "@/features/me/sign-out-button";
import { PAGE_CONTAINER } from "@/lib/layout";
import { HOME_PATH } from "@/lib/routes";
import { shortName } from "@/lib/user-name";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/server/auth/types";
import { AppNav } from "./app-nav";
import { AppNavLinks } from "./app-nav-links";

// Mobile: product name and account on the first row, the nav on its own row
// below. From sm up everything sits on one line, the nav next to the name.
const BAR = cn(
  PAGE_CONTAINER,
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 pt-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-10 sm:pt-0",
);
const NAV =
  "col-span-2 row-start-2 sm:col-span-1 sm:row-start-1 sm:col-start-2";

// Header for signed-in pages (server component). Only the short name reaches the HTML.
export function AppHeader({
  user,
}: {
  user: Pick<SessionUser, "firstName" | "lastName">;
}) {
  return (
    <header className="border-b border-rule bg-paper">
      <div className={BAR}>
        <ProductLink />
        <AppNav className={NAV} />
        <div className="flex items-center gap-3 sm:gap-4 sm:py-3">
          <p className="text-[0.9375rem] text-slate">
            <span className="sr-only">Signed in as </span>
            <span className="font-semibold whitespace-nowrap text-ink">
              {shortName(user)}
            </span>
          </p>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

// Same bar while the session loads, so the page does not jump.
export function AppHeaderSkeleton() {
  return (
    <header className="border-b border-rule bg-paper">
      <div className={BAR}>
        <ProductLink />
        <AppNavLinks className={NAV} />
        <div
          aria-hidden="true"
          className="flex items-center gap-3 sm:gap-4 sm:py-3"
        >
          <span className="h-4 w-14 rounded-full bg-mist" />
          <span className="h-9 w-[5.5rem] rounded-lg bg-mist" />
        </div>
      </div>
    </header>
  );
}

function ProductLink() {
  return (
    <Link
      href={HOME_PATH}
      className="w-fit rounded-sm text-[1rem] leading-tight font-extrabold tracking-[-0.02em] text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt"
    >
      Product Review System
    </Link>
  );
}
