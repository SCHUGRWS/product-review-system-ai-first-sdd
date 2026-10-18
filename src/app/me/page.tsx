import type { Metadata } from "next";
import { Suspense } from "react";
import { MeContent, MeSkeleton } from "@/features/me/me-content";

export const metadata: Metadata = {
  title: "My page | Product Review System",
};

// The skeleton is the prerendered static shell; the session-dependent content
// streams in behind the boundary (Cache Components).
export default function MePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Suspense fallback={<MeSkeleton />}>
        <MeContent />
      </Suspense>
    </div>
  );
}
