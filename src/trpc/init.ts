import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";

export const log = logger.child({ module: "trpc" });

export async function createTRPCContext() {
  return { auth: await auth(), logger: log };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      auth: ctx.auth,
      logger: ctx.logger,
    },
  });
});

export const createCallerFactory = t.createCallerFactory;
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
