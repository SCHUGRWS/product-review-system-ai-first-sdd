import { z } from "zod";
import { LOCALES } from "@/i18n/locales";
import { serializeLocaleCookie } from "@/server/auth/cookie";
import { getDb } from "@/server/db";
import { appError } from "@/server/errors";
import { protectedProcedure, router } from "@/server/trpc";

export const setLocaleSchema = z.object({ locale: z.enum(LOCALES) });

// The signed-in user's settings (specs/i18n.md).
export const accountRouter = router({
  // Saves the UI language on the account, so it follows the user to other
  // devices, and sets prs_locale for URLs without a locale on this one.
  setLocale: protectedProcedure
    .input(setLocaleSchema)
    .mutation(async ({ ctx, input }) => {
      const { error } = await getDb()
        .from("accounts")
        .update({ locale: input.locale })
        .eq("id", ctx.user.id);
      if (error) {
        console.error("[account.setLocale] failed to save the locale", error);
        throw appError("INTERNAL_SERVER_ERROR", "errors.localeFailed");
      }
      ctx.resHeaders.append("Set-Cookie", serializeLocaleCookie(input.locale));
      return { locale: input.locale };
    }),
});
