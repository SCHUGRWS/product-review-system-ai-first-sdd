import { createCallerFactory, router } from "@/server/trpc";
import { accountRouter } from "./account";
import { authRouter } from "./auth";
import { feedbackRouter } from "./feedback";
import { productRouter } from "./product";
import { reviewRouter } from "./review";

export const appRouter = router({
  account: accountRouter,
  auth: authRouter,
  feedback: feedbackRouter,
  product: productRouter,
  review: reviewRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
