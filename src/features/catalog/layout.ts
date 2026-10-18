import { PAGE_CONTAINER } from "@/lib/layout";

export const CONTAINER = PAGE_CONTAINER;

// Fixed card width inside rows, so skeletons and real cards line up
export const ROW_ITEM = "w-[10.5rem] shrink-0 snap-start sm:w-[12.5rem]";

export const GRID =
  "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

export const SECTION_TITLE =
  "text-[1.563rem] leading-tight font-extrabold tracking-[-0.025em] text-ink";

export const TEXT_LINK =
  "rounded-sm font-semibold text-cobalt underline-offset-4 hover:text-cobalt-deep hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt";

// The page's one motion moment: cards rise into place once as their list
// arrives (tw-animate-css; motion-safe so reduced motion shows them still).
export const ARRIVE =
  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500 motion-safe:fill-mode-both motion-safe:ease-out";

export function arriveDelay(index: number) {
  return { animationDelay: `${Math.min(index, 6) * 45}ms` };
}
