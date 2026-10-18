import "server-only";
import { cache } from "react";
import { requireUser } from "@/server/auth/current-user";

// The header and the catalog both gate on the session; cache() makes that a
// single lookup per request. Without a session it redirects to sign-in.
export const requireCatalogUser = cache(() => requireUser());
