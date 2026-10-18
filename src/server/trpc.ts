import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError, z } from "zod";
import type { Context } from "@/server/context";

export const VALIDATION_MESSAGE = "Some fields are invalid";

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
        // Field-level validation errors, so clients can show them next to inputs
        zodError,
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
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sign in to continue",
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
