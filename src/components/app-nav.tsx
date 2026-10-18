"use client";

import { usePathname } from "next/navigation";
import { AppNavLinks } from "./app-nav-links";

// Main navigation for signed-in pages; the current page is marked for screen
// readers (aria-current) and with a cobalt underline.
export function AppNav({ className }: { className?: string }) {
  return <AppNavLinks current={usePathname()} className={className} />;
}
