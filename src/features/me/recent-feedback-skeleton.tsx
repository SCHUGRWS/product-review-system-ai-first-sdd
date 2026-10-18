import { getT } from "@/i18n/server";

// Placeholder strips shaped like compact review slips while the list streams in.
export async function RecentFeedbackSkeleton() {
  const t = await getT();
  return (
    <output className="mt-6 grid gap-5 sm:grid-cols-2">
      <span className="sr-only">{t("me.loadingRecent")}</span>
      {[0, 1].map((n) => (
        <div
          key={n}
          aria-hidden="true"
          className="rounded-sm border border-dashed border-rule px-6 pt-7 pb-8 motion-safe:animate-pulse"
        >
          <div className="h-3 w-1/2 rounded-full bg-mist" />
          <div className="mt-3 h-4 w-24 rounded-full bg-mist" />
          <div className="mt-5 space-y-2.5">
            <div className="h-3 w-full rounded-full bg-mist" />
            <div className="h-3 w-4/5 rounded-full bg-mist" />
          </div>
        </div>
      ))}
    </output>
  );
}
