import { en, type MessageKey } from "./dictionaries/en";

export type MessageVars = Record<string, string | number>;

// Phase 0 placeholder (plans/03-product-reviews/execution.md): always English.
// The translation step makes it locale-aware without changing call sites.
export function t(key: MessageKey, vars?: MessageVars): string {
  const template: string = en[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
