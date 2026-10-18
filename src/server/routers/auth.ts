import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { checkBotId } from "botid/server";
import { nanoid } from "nanoid";
import { signInSchema } from "@/features/auth/sign-in.schema";
import { signUpSchema } from "@/features/auth/sign-up.schema";
import {
  serializeClearedSessionCookie,
  serializeSessionCookie,
} from "@/server/auth/cookie";
import { createSession, deleteSession } from "@/server/auth/session";
import { getDb } from "@/server/db";
import { publicProcedure, router } from "@/server/trpc";

const BCRYPT_COST = 12;
const UNIQUE_VIOLATION = "23505";
const INVALID_CREDENTIALS = "Invalid email or password";

// Compared against when the email is unknown, so the response takes as long
// as a real password check and does not reveal which emails are registered.
const DUMMY_HASH =
  "$2b$12$Zu0TAtMYUvINnodkQqZdjegCPh8bD.Ghaswkz4TnWxGVt8fgT1AD2";

type AccountRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  active: boolean;
};

export const authRouter = router({
  signUp: publicProcedure.input(signUpSchema).mutation(async ({ input }) => {
    // Vercel BotID blocks automated sign-ups. It only works on Vercel (VERCEL
    // is set there): a local `next start`, like the E2E server, has no
    // challenge to read, so the check is skipped outside Vercel.
    if (process.env.VERCEL && (await checkBotId()).isBot) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
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
        throw new TRPCError({
          code: "CONFLICT",
          message: "This email is already registered",
        });
      }
      console.error("[auth.signUp] failed to insert account", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not create the account. Please try again later.",
      });
    }

    return { id, email: input.email };
  }),

  signIn: publicProcedure
    .input(signInSchema)
    .mutation(async ({ input, ctx }) => {
      const { data: account, error } = await getDb()
        .from("accounts")
        .select("id, first_name, last_name, email, password, active")
        .eq("email", input.email)
        .maybeSingle<AccountRow>();

      if (error) {
        console.error("[auth.signIn] failed to read account", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not sign in. Please try again later.",
        });
      }

      // Always run bcrypt, even without an account, so timing stays the same
      const passwordMatches = await bcrypt.compare(
        input.password,
        account?.password ?? DUMMY_HASH,
      );
      if (!account || !passwordMatches || !account.active) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: INVALID_CREDENTIALS,
        });
      }

      let session: Awaited<ReturnType<typeof createSession>>;
      try {
        session = await createSession(account.id);
      } catch (cause) {
        console.error("[auth.signIn] failed to create session", cause);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not sign in. Please try again later.",
        });
      }

      ctx.resHeaders.append(
        "Set-Cookie",
        serializeSessionCookie(session.token, session.expiresAt),
      );

      return {
        id: account.id,
        firstName: account.first_name,
        lastName: account.last_name,
        email: account.email,
      };
    }),

  // Idempotent: without a session it only clears the cookie.
  signOut: publicProcedure.mutation(async ({ ctx }): Promise<{ ok: true }> => {
    if (ctx.sessionToken) {
      try {
        await deleteSession(ctx.sessionToken);
      } catch (cause) {
        console.error("[auth.signOut] failed to delete session", cause);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not sign out. Please try again later.",
        });
      }
    }
    ctx.resHeaders.append("Set-Cookie", serializeClearedSessionCookie());
    return { ok: true };
  }),
});
