"use client";

import { useT } from "@/i18n/client";
import { PAGE_CONTAINER } from "@/lib/layout";
import { cn } from "@/lib/utils";

// Study-project disclaimer (specs/home.md). The landing page shows the full
// notice; every other page ends with the short footer.
export const GITHUB_ISSUES_URL =
  "https://github.com/SCHUGRWS/product-review-system-ai-first-sdd/issues";

function GitHubLink({ className }: { className?: string }) {
  const t = useT();
  return (
    <a
      href={GITHUB_ISSUES_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "rounded-sm font-semibold text-cobalt underline underline-offset-4 hover:text-cobalt-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt",
        className,
      )}
    >
      {t("disclaimer.contact")}
      <span className="sr-only"> {t("disclaimer.opensNewTab")}</span>
    </a>
  );
}

// Full notice for the landing page: calm, inline, below the calls to action.
export function StudyNotice({ className }: { className?: string }) {
  const t = useT();
  return (
    <section
      aria-labelledby="study-notice-title"
      className={cn("max-w-[52ch] border-t border-rule pt-6", className)}
    >
      <h2
        id="study-notice-title"
        className="text-[1rem] font-bold tracking-[-0.01em] text-ink"
      >
        {t("disclaimer.title")}
      </h2>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-slate">
        {t("disclaimer.body")}
      </p>
      <GitHubLink className="mt-3 inline-block text-[0.9375rem]" />
    </section>
  );
}

// Short footer. "page" spans the screen inside PAGE_CONTAINER (signed-in
// pages); "column" sits at the bottom of the split layout's content column,
// which already has its own gutters.
export function SiteFooter({
  variant = "page",
}: {
  variant?: "page" | "column";
}) {
  const t = useT();
  const text = (
    <p className="max-w-[72ch] text-[0.875rem] leading-relaxed text-slate">
      {t("disclaimer.footer")} <GitHubLink />
    </p>
  );
  if (variant === "column") {
    return <footer className="border-t border-rule pt-4">{text}</footer>;
  }
  return (
    <footer className="border-t border-rule bg-paper">
      <div className={cn(PAGE_CONTAINER, "py-6")}>{text}</div>
    </footer>
  );
}
