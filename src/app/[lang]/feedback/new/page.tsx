import { redirect } from "next/navigation";
import { getLocale } from "@/i18n/server";
import { homeHref } from "@/lib/routes";

// Feedback is now written for a catalog product (/products/<id>/feedback), so
// the old form page sends people to the catalog to pick one.
export default async function NewFeedbackPage() {
  redirect(homeHref(await getLocale()));
}
