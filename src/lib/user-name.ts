import type { SessionUser } from "@/server/auth/types";

type NamedUser = Pick<SessionUser, "firstName" | "lastName">;

// First letter of a name as one character, even when the accent is a separate code point.
function initial(name: string) {
  const [first = ""] = Array.from(name.trim().normalize("NFC"));
  return first.toUpperCase();
}

// How the user is shown in the header and on reviews: "Ada L.".
export function shortName(user: NamedUser) {
  const first = user.firstName.trim();
  const last = initial(user.lastName);
  return last ? `${first} ${last}.` : first;
}

export function fullName(user: NamedUser) {
  return [user.firstName.trim(), user.lastName.trim()]
    .filter(Boolean)
    .join(" ");
}
