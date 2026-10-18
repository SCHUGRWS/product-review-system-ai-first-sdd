import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string) => createHash("sha256").update(value).digest();

/**
 * Checks `Authorization: Bearer <PRODUCTS_IMPORT_TOKEN>` in constant time.
 * Fails closed when the env var is not set. Both sides are hashed first, so
 * the comparison takes the same time whatever the length of the sent token.
 */
export function isAuthorizedImport(header: string | null | undefined) {
  const expected = process.env.PRODUCTS_IMPORT_TOKEN;
  if (!expected || !header) return false;
  const match = header.match(/^Bearer\s+(\S+)\s*$/);
  if (!match) return false;
  return timingSafeEqual(digest(match[1]), digest(expected));
}
