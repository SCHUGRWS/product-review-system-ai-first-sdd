import { notFound } from "next/navigation";

// Any /<locale>/... URL without a page: the localized 404 of [lang]/not-found.tsx
// (the root layout lives in [lang], so only a segment inside it can show it).
export default function CatchAll() {
  notFound();
}
