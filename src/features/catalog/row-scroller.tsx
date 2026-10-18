"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

// Horizontal list that scrolls inside itself (snap on touch). On desktop two
// buttons page through it; keyboard users reach every card by tabbing, which
// scrolls the focused card into view.
export function RowScroller({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const t = useT();
  const listRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const max = list.scrollWidth - list.clientWidth;
    setEdges({ start: list.scrollLeft <= 4, end: list.scrollLeft >= max - 4 });
  }, []);

  useEffect(() => {
    update();
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(update);
    observer.observe(list);
    return () => observer.disconnect();
  }, [update]);

  function page(direction: 1 | -1) {
    const list = listRef.current;
    if (!list) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    list.scrollBy({
      left: direction * list.clientWidth * 0.85,
      behavior: reduce ? "auto" : "smooth",
    });
  }

  return (
    // Below lg the list bleeds to the screen edges (cards peek in); from lg
    // it is clipped to the page container, so rows stay centered on wide screens.
    <div className="relative lg:mx-auto lg:max-w-page lg:px-12">
      <ul
        ref={listRef}
        onScroll={update}
        aria-label={label}
        className="flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto overscroll-x-contain px-6 pt-2 pb-6 [scrollbar-width:thin] sm:scroll-px-12 sm:gap-5 sm:px-12 lg:scroll-px-0 lg:px-0"
      >
        {children}
      </ul>
      <div className="pointer-events-none absolute inset-x-0 top-[38%] hidden justify-between px-2 md:flex lg:px-0.5">
        <StepButton
          label={t("catalog.row.previous", { title: label })}
          hidden={edges.start}
          onClick={() => page(-1)}
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </StepButton>
        <StepButton
          label={t("catalog.row.next", { title: label })}
          hidden={edges.end}
          onClick={() => page(1)}
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({
  label,
  hidden,
  onClick,
  children,
}: {
  label: string;
  hidden: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={hidden}
      className={cn(
        "pointer-events-auto inline-flex size-11 items-center justify-center rounded-full bg-paper text-cobalt shadow-[0_8px_20px_rgb(14_24_110/0.22)] ring-1 ring-rule transition-opacity hover:text-cobalt-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt",
        hidden && "pointer-events-none opacity-0",
      )}
    >
      {children}
    </button>
  );
}
