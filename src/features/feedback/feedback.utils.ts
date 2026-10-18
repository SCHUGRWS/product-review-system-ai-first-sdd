import { formatDistanceStrict } from "date-fns";

// "Posted 3 days ago"; anything under a minute reads "Posted just now".
export function postedAgo(createdAt: Date, now: Date = new Date()) {
  if (now.getTime() - createdAt.getTime() < 60_000) return "Posted just now";
  return `Posted ${formatDistanceStrict(createdAt, now, { addSuffix: true })}`;
}

// Amazon titles run long; the slip prints at most `max` characters, cut at a
// word boundary when there is one, with an ellipsis.
export function shortTitle(title: string, max = 80) {
  const text = title.trim().replace(/\s+/g, " ");
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  // The cut already ends a word when the next character is a space
  const space = text[cut.length] === " " ? cut.length : cut.lastIndexOf(" ");
  const base = space > max / 2 ? cut.slice(0, space) : cut;
  return `${base.replace(/[\s,;:.\-–]+$/, "")}…`;
}
