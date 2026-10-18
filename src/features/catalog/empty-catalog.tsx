import Link from "next/link";
import { getT } from "@/i18n/server";
import { cn } from "@/lib/utils";
import { CONTAINER, TEXT_LINK } from "./layout";

// Shown before the first import: nothing is broken, the deals are not in yet.
export async function EmptyCatalog() {
  const t = await getT();
  return (
    <div className={cn(CONTAINER, "py-14 sm:py-20")}>
      <Notice title={t("catalog.empty.title")}>
        {t("catalog.empty.body")}
      </Notice>
    </div>
  );
}

// A quiet mist panel for empty, invalid and failed states.
export function Notice({
  title,
  children,
  action,
  tone = "neutral",
  headingLevel = 2,
}: {
  title: string;
  children?: React.ReactNode;
  action?: { href: string; label: string };
  tone?: "neutral" | "error";
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className="max-w-[40rem] rounded-md bg-mist px-6 py-7 sm:px-8"
    >
      <Heading
        className={cn(
          "text-[1.25rem] leading-snug font-bold tracking-[-0.015em]",
          tone === "error" ? "text-destructive" : "text-ink",
        )}
      >
        {title}
      </Heading>
      {children && (
        <p className="mt-2 max-w-[52ch] text-[1rem] leading-relaxed text-slate">
          {children}
        </p>
      )}
      {action && (
        <Link
          href={action.href}
          className={cn(TEXT_LINK, "mt-4 inline-block text-[1rem] underline")}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
