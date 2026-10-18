import { redirect } from "next/navigation";
import { HOME_PATH } from "@/lib/routes";

// Feedback is now written for a catalog product (/products/<id>/feedback), so
// the old form page sends people to the catalog to pick one.
export default function NewFeedbackPage() {
  redirect(HOME_PATH);
}
