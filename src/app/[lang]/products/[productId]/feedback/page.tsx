import type { Metadata } from "next";
import { Suspense } from "react";
import { SplitLayout } from "@/components/split-layout";
import { ProductFeedback } from "@/features/feedback/product-feedback";
import { getT } from "@/i18n/server";
import { pageTitle } from "@/lib/app-name";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: pageTitle(t("meta.feedback")) };
}

export default function ProductFeedbackPage({
  params,
}: PageProps<"/[lang]/products/[productId]/feedback">) {
  return (
    <Suspense fallback={<ProductFeedbackShell />}>
      <ProductFeedback params={params} />
    </Suspense>
  );
}

// Static shell shown while the session and the product load.
async function ProductFeedbackShell() {
  const t = await getT();
  return (
    <SplitLayout
      panel={<div className="h-80 w-full max-w-[18rem] sm:max-w-sm" />}
    >
      <div className="w-full max-w-md" aria-busy="true">
        <h1 className="text-[1.953rem] leading-tight font-extrabold tracking-[-0.03em] text-ink">
          {t("feedback.form.title")}
        </h1>
        <div className="mt-4 h-5 w-3/4 rounded-sm bg-mist" />
        <div className="mt-6 h-24 rounded-lg bg-mist" />
        <div className="mt-8 flex flex-col gap-6">
          <div className="h-10 w-48 rounded-lg bg-mist" />
          <div className="h-32 rounded-lg bg-mist" />
        </div>
      </div>
    </SplitLayout>
  );
}
