import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter } from "@/components/site-footer";
import { MeContent, MeSkeleton } from "@/features/me/me-content";
import { getT } from "@/i18n/server";
import { pageTitle } from "@/lib/app-name";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: pageTitle(t("meta.me")) };
}

// The skeleton is the prerendered static shell; the session-dependent content
// streams in behind the boundary (Cache Components).
export default function MePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Suspense fallback={<MeSkeleton />}>
        <MeContent />
      </Suspense>
      <SiteFooter />
    </div>
  );
}
