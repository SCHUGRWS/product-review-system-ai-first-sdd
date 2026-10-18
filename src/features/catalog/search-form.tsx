"use client";

import { SearchIcon, XIcon } from "lucide-react";
import Form from "next/form";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLocale, useT } from "@/i18n/client";
import { homeHref } from "@/lib/routes";
import { MAX_QUERY_LENGTH } from "./catalog-params";

const FIELD =
  "flex h-14 w-full items-center rounded-lg bg-paper pl-4 shadow-[0_14px_30px_rgb(14_24_110/0.35)] sm:h-16 sm:pl-5";

// GET form to /home?q=. The page passes the text from the URL and remounts
// the form (key) when it changes, so the back button restores the field.
export function SearchForm({
  defaultValue = "",
  autoFocus = false,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const t = useT();
  const home = homeHref(useLocale());
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);

  // "Write feedback" on /me links here with ?focus=search
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function clear() {
    setValue("");
    inputRef.current?.focus();
    // Only navigate when the URL holds a search; otherwise just empty the field
    if (defaultValue) router.push(home);
  }

  return (
    <Form action={home} role="search" className="w-full">
      <label
        htmlFor="catalog-search"
        className="mb-2.5 block text-[0.9375rem] font-semibold text-paper"
      >
        {t("catalog.search.label")}
      </label>
      <div className={FIELD}>
        <SearchIcon aria-hidden="true" className="size-5 shrink-0 text-slate" />
        <input
          ref={inputRef}
          id="catalog-search"
          name="q"
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={MAX_QUERY_LENGTH}
          autoComplete="off"
          enterKeyHint="search"
          placeholder={t("catalog.search.placeholder")}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-[1.0625rem] text-ink outline-none placeholder:text-slate/80 [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={clear}
            aria-label={t("catalog.search.clear")}
            className="mr-1 inline-flex size-10 shrink-0 items-center justify-center rounded-md text-slate hover:bg-mist hover:text-ink focus-visible:outline-2 focus-visible:outline-cobalt"
          >
            <XIcon aria-hidden="true" className="size-5" />
          </button>
        )}
        <button
          type="submit"
          className="mr-2 h-10 shrink-0 rounded-md bg-cobalt px-4 text-[0.9375rem] font-semibold text-paper hover:bg-cobalt-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt sm:h-12 sm:px-6"
        >
          {t("catalog.search.submit")}
        </button>
      </div>
    </Form>
  );
}

// Non-interactive stand-in for the static shell, so nothing typed into it is
// lost when the real form streams in.
export function SearchFormSkeleton() {
  const t = useT();
  return (
    <div aria-hidden="true" className="w-full">
      <span className="mb-2.5 block text-[0.9375rem] font-semibold text-paper">
        {t("catalog.search.label")}
      </span>
      <div className={FIELD}>
        <SearchIcon className="size-5 shrink-0 text-slate" />
        <span className="flex-1 px-3 text-[1.0625rem] text-slate/80">
          {t("catalog.search.placeholder")}
        </span>
        <span className="mr-2 inline-flex h-10 items-center rounded-md bg-cobalt px-4 text-[0.9375rem] font-semibold text-paper sm:h-12 sm:px-6">
          {t("catalog.search.submit")}
        </span>
      </div>
    </div>
  );
}
