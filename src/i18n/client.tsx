"use client";

import { createContext, useCallback, useContext } from "react";
import type { MessageKey, Messages } from "./dictionaries/en";
import { DEFAULT_LOCALE, type Locale } from "./locales";
import { formatMessage, type T, VALIDATION_VARS } from "./message";

// Client side of the translation: the root layout passes the locale and only
// the messages client components use (CLIENT_MESSAGE_PREFIXES), never the
// whole dictionaries.

type I18nValue = { locale: Locale; messages: Partial<Messages> };

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  messages: {},
});

export function I18nProvider({
  locale,
  messages,
  children,
}: I18nValue & { children: React.ReactNode }) {
  return (
    <I18nContext.Provider value={{ locale, messages }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(I18nContext).locale;
}

export function useT(): T {
  const { messages } = useContext(I18nContext);
  return useCallback(
    (key: MessageKey, vars) => {
      const template = messages[key];
      if (template === undefined) {
        console.error(`[i18n] "${key}" was not passed to the client`);
        return key;
      }
      return formatMessage(template, vars);
    },
    [messages],
  );
}

/**
 * Translates messages that may be keys (zod field errors, tRPC error keys);
 * anything else is returned as it is.
 */
export function useTranslateMessage() {
  const { messages } = useContext(I18nContext);
  return useCallback(
    (message: string | undefined) => {
      if (message === undefined) return undefined;
      const template = messages[message as MessageKey];
      return template === undefined
        ? message
        : formatMessage(template, VALIDATION_VARS);
    },
    [messages],
  );
}
