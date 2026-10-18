import type { Metadata } from "next";
import { Suspense } from "react";
import { AppHeaderSkeleton } from "@/components/app-header";
import { SiteFooter } from "@/components/site-footer";
import {
  CatalogHeader,
  CatalogSearch,
} from "@/features/catalog/catalog-chrome";
import { ListsSkeleton } from "@/features/catalog/catalog-skeletons";
import { CatalogView } from "@/features/catalog/catalog-view";
import { CONTAINER } from "@/features/catalog/layout";
import { SearchFormSkeleton } from "@/features/catalog/search-form";
import { getT } from "@/i18n/server";
import { pageTitle } from "@/lib/app-name";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: pageTitle(t("meta.home")) };
}

// Static shell: header skeleton, the cobalt search band and list skeletons.
// The session, the URL (q, category, page, focus) and the products stream in
// behind their own boundaries (Cache Components).
export default async function HomePage({
  searchParams,
}: PageProps<"/[lang]/home">) {
  const t = await getT();
  return (
    <div className="flex min-h-dvh flex-col">
      <Suspense fallback={<AppHeaderSkeleton />}>
        <CatalogHeader />
      </Suspense>
      <main className="flex-1 pb-16">
        <section
          aria-labelledby="catalog-title"
          className="halftone-field overflow-hidden"
        >
          <div className={cn(CONTAINER, "py-10 sm:py-14")}>
            <h1
              id="catalog-title"
              className="max-w-[18ch] text-[clamp(2.25rem,5vw,3.375rem)] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance text-paper"
            >
              {t("catalog.title")}
            </h1>
            <p className="mt-4 max-w-[46ch] text-[1.0625rem] leading-relaxed text-paper/85">
              {t("catalog.lead")}
            </p>
            <div className="mt-8 max-w-[44rem]">
              <Suspense fallback={<SearchFormSkeleton />}>
                <CatalogSearch searchParams={searchParams} />
              </Suspense>
            </div>
          </div>
        </section>
        <Suspense fallback={<ListsSkeleton />}>
          <CatalogView searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
