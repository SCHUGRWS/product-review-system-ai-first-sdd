import Link from "next/link";
import { cn } from "@/lib/utils";

// Two-column page: content on paper, a cobalt panel for the review slip.
// On small screens the panel becomes a band above the content. From lg the
// page splits about 1.05:1: the content and the slip sit in a centered
// frame (--container-split), while the paper and the cobalt field run to the edges,
// so wide and ultra-wide screens stay balanced.
export function SplitLayout({
  children,
  panel,
  panelFirstOnMobile = true,
  className,
}: {
  children: React.ReactNode;
  panel: React.ReactNode;
  panelFirstOnMobile?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid min-h-dvh flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,calc(var(--container-split)*0.5125))_minmax(0,calc(var(--container-split)*0.4875))_minmax(0,1fr)]",
        className,
      )}
    >
      <div className="flex flex-col px-6 py-6 sm:px-12 lg:col-start-2 lg:row-start-1 lg:px-16 lg:py-10">
        <Link
          href="/"
          className="w-fit rounded-sm text-[1rem] font-extrabold tracking-[-0.02em] text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt"
        >
          Product Review System
        </Link>
        <main className="flex flex-1 flex-col justify-center py-10 lg:py-16">
          {children}
        </main>
      </div>
      <aside
        aria-hidden="true"
        className={cn(
          "halftone-field flex items-center justify-center overflow-hidden px-6 py-8 sm:px-12 lg:order-none lg:col-span-2 lg:col-start-3 lg:row-start-1 lg:justify-start lg:px-0 lg:py-16",
          panelFirstOnMobile && "order-first",
        )}
      >
        <div
          data-split-panel
          className="flex w-full items-center justify-center lg:max-w-[calc(var(--container-split)*0.4875)] lg:px-16"
        >
          {panel}
        </div>
      </aside>
    </div>
  );
}
