import { format } from "date-fns";
import type { SessionUser } from "@/server/auth/types";

export function greeting(user: Pick<SessionUser, "firstName">) {
  return `Welcome back, ${user.firstName.trim()}`;
}

// Month and year in UTC, so an account created on the 1st just after midnight
// UTC does not show the previous month for users west of Greenwich.
export function memberSince(createdAt: Date) {
  const utcMonth = new Date(
    createdAt.getUTCFullYear(),
    createdAt.getUTCMonth(),
    1,
  );
  return `Member since ${format(utcMonth, "MMMM yyyy")}`;
}
