import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError, z } from "zod";
import { translate } from "@/i18n/t";
import type { Context } from "@/server/context";
import { appError, MessageKeyCause } from "@/server/errors";

export const VALIDATION_MESSAGE = translate("en", "errors.validation");

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const zodError =
      error.code === "BAD_REQUEST" && error.cause instanceof ZodError
        ? z.flattenError(error.cause)
        : null;
    return {
      ...shape,
      // tRPC uses the raw Zod issues JSON as message; replace it with a readable one
      message: zodError ? VALIDATION_MESSAGE : shape.message,
      data: {
        ...shape.data,
        // Field-level validation errors, so clients can show them next to
        // inputs; their messages are keys the UI translates
        zodError,
        // The UI shows the message in its own language (src/i18n/errors.ts)
        messageKey: zodError
          ? ("errors.validation" as const)
          : error.cause instanceof MessageKeyCause
            ? error.cause.key
            : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

// Requires a signed-in user; narrows ctx.user to non-null for the resolver.
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw appError("UNAUTHORIZED", "errors.signInRequired");
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
