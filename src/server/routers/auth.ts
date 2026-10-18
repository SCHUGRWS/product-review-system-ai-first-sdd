import bcrypt from "bcryptjs";
import { checkBotId } from "botid/server";
import { nanoid } from "nanoid";
import { signInSchema } from "@/features/auth/sign-in.schema";
import { signUpSchema } from "@/features/auth/sign-up.schema";
import { DEFAULT_LOCALE, hasLocale, type Locale } from "@/i18n/locales";
import {
  serializeClearedSessionCookie,
  serializeLocaleCookie,
  serializeSessionCookie,
} from "@/server/auth/cookie";
import { createSession, deleteSession } from "@/server/auth/session";
import { getDb } from "@/server/db";
import { appError } from "@/server/errors";
import { publicProcedure, router } from "@/server/trpc";
import type { Tables } from "@/types/database";

const BCRYPT_COST = 12;
const UNIQUE_VIOLATION = "23505";

// Compared against when the email is unknown, so the response takes as long
// as a real password check and does not reveal which emails are registered.
const DUMMY_HASH =
  "$2b$12$Zu0TAtMYUvINnodkQqZdjegCPh8bD.Ghaswkz4TnWxGVt8fgT1AD2";

type AccountRow = Pick<
  Tables<"accounts">,
  "id" | "first_name" | "last_name" | "email" | "password" | "active" | "locale"
>;

export const authRouter = router({
  signUp: publicProcedure.input(signUpSchema).mutation(async ({ input }) => {
    // Vercel BotID blocks automated sign-ups. It only works on Vercel (VERCEL
    // is set there): a local `next start`, like the E2E server, has no
    // challenge to read, so the check is skipped outside Vercel.
    if (process.env.VERCEL && (await checkBotId()).isBot) {
      throw appError("FORBIDDEN", "errors.accessDenied");
    }

    const salt = await bcrypt.genSalt(BCRYPT_COST);
    const passwordHash = await bcrypt.hash(input.password, salt);
    const id = nanoid();

    const { error } = await getDb().from("accounts").insert({
      id,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      password: passwordHash,
      salt,
      active: true,
    });

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        throw appError("CONFLICT", "errors.emailTaken");
      }
      console.error("[auth.signUp] failed to insert account", error);
      throw appError("INTERNAL_SERVER_ERROR", "errors.signUpFailed");
    }

    return { id, email: input.email };
  }),

  signIn: publicProcedure
    .input(signInSchema)
    .mutation(async ({ input, ctx }) => {
      const { data: account, error } = await getDb()
        .from("accounts")
        .select("id, first_name, last_name, email, password, active, locale")
        .eq("email", input.email)
        .maybeSingle<AccountRow>();

      if (error) {
        console.error("[auth.signIn] failed to read account", error);
        throw appError("INTERNAL_SERVER_ERROR", "errors.signInFailed");
      }

      // Always run bcrypt, even without an account, so timing stays the same
      const passwordMatches = await bcrypt.compare(
        input.password,
        account?.password ?? DUMMY_HASH,
      );
      if (!account || !passwordMatches || !account.active) {
        throw appError("UNAUTHORIZED", "errors.invalidCredentials");
      }

      let session: Awaited<ReturnType<typeof createSession>>;
      try {
        session = await createSession(account.id);
      } catch (cause) {
        console.error("[auth.signIn] failed to create session", cause);
        throw appError("INTERNAL_SERVER_ERROR", "errors.signInFailed");
      }

      // The account's language follows the user to this device: the cookie
      // steers URLs without a locale, and the client goes to /<locale>/home
      const locale: Locale = hasLocale(account.locale)
        ? account.locale
        : DEFAULT_LOCALE;
      ctx.resHeaders.append(
        "Set-Cookie",
        serializeSessionCookie(session.token, session.expiresAt),
      );
      ctx.resHeaders.append("Set-Cookie", serializeLocaleCookie(locale));

      return {
        id: account.id,
        firstName: account.first_name,
        lastName: account.last_name,
        email: account.email,
        locale,
      };
    }),

  // Idempotent: without a session it only clears the cookie.
  signOut: publicProcedure.mutation(async ({ ctx }): Promise<{ ok: true }> => {
    if (ctx.sessionToken) {
      try {
        await deleteSession(ctx.sessionToken);
      } catch (cause) {
        console.error("[auth.signOut] failed to delete session", cause);
        throw appError("INTERNAL_SERVER_ERROR", "errors.signOutFailed");
      }
    }
    ctx.resHeaders.append("Set-Cookie", serializeClearedSessionCookie());
    return { ok: true };
  }),
});
