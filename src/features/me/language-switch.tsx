"use client";

import { useMutation } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useId } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useLocale, useT } from "@/i18n/client";
import { errorMessage } from "@/i18n/errors";
import { hasLocale, LOCALE_NAMES, LOCALES } from "@/i18n/locales";
import { switchLocaleHref } from "@/lib/routes";
import { useTRPC } from "@/trpc/client";

// "Language" on /me (specs/i18n.md): saves the choice on the account (and the
// prs_locale cookie), then opens the same page in the new language. Language
// names are written in their own language.
export function LanguageSwitch() {
  const t = useT();
  const locale = useLocale();
  const pathname = usePathname();
  const trpc = useTRPC();
  const id = useId();

  const setLocale = useMutation(
    trpc.account.setLocale.mutationOptions({
      onSuccess: ({ locale: saved }) => {
        // A full load: the new root segment brings its own messages and <html lang>
        window.location.assign(
          `${switchLocaleHref(pathname, saved)}${window.location.search}`,
        );
      },
      onError: (error) => {
        toast.error(errorMessage(t, error));
      },
    }),
  );
  // Disabled after success until the new page replaces this one
  const isPending = setLocale.isPending || setLocale.isSuccess;

  return (
    <div className="mt-6 border-t border-dashed border-rule pt-4">
      <label
        htmlFor={id}
        className="block text-[0.9375rem] font-semibold text-ink"
      >
        {t("me.language.label")}
      </label>
      <div className="mt-2 flex items-center gap-3">
        <select
          id={id}
          value={locale}
          disabled={isPending}
          aria-describedby={`${id}-hint`}
          onChange={(event) => {
            const next = event.target.value;
            if (hasLocale(next) && next !== locale) {
              setLocale.mutate({ locale: next });
            }
          }}
          className="h-10 w-full rounded-lg border border-rule bg-paper px-3 text-[1rem] text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:opacity-60"
        >
          {LOCALES.map((option) => (
            <option key={option} value={option} lang={option}>
              {LOCALE_NAMES[option]}
            </option>
          ))}
        </select>
        {isPending && (
          <span className="flex shrink-0 items-center gap-1.5 text-[0.875rem] text-slate">
            <Spinner />
            {t("me.language.saving")}
          </span>
        )}
      </div>
      <p id={`${id}-hint`} className="mt-2 text-[0.8125rem] text-slate">
        {t("me.language.hint")}
      </p>
    </div>
  );
}
