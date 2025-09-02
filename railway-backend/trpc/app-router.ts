import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { verifyPurchaseProcedure, cancelSubscriptionProcedure } from "./routes/subscription/verify/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  subscription: createTRPCRouter({
    verifyPurchase: verifyPurchaseProcedure,
    cancel: cancelSubscriptionProcedure,
  }),
});

export type AppRouter = typeof appRouter;