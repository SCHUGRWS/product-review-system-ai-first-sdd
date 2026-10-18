import { COMMENT_MAX, COMMENT_MIN } from "@/features/feedback/feedback.schema";
import type { MessageKey } from "./dictionaries/en";

export type MessageVars = Record<string, string | number>;
export type T = (key: MessageKey, vars?: MessageVars) => string;

// Limits the validation messages print ("at least {commentMin} characters"):
// the schemas return bare keys, and these fill them on both sides.
export const VALIDATION_VARS: MessageVars = {
  commentMin: COMMENT_MIN,
  commentMax: COMMENT_MAX,
  passwordMin: 8,
  nameMax: 100,
};

/** Fills {name} placeholders; unknown ones are kept as they are */
export function formatMessage(template: string, vars?: MessageVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
