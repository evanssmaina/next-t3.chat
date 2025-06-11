import { DrizzleError } from "@/server/db";
import { logger } from "@/utils/logger";
import { auth } from "@clerk/nextjs/server";
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";

export const createTRPCContext = async () => {
  return {
    auth: await auth(),
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

const isAuthed = t.middleware(async ({ next, ctx }) => {
  const { auth } = ctx;

  if (!auth.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  try {
    return next({
      ctx: {
        auth,
      },
    });
  } catch (error) {
    if (error instanceof DrizzleError) {
      logger("Database error in isAuthed middleware:", error.message);
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong while accessing business data",
    });
  }
});

export const protectedProcedure = t.procedure.use(isAuthed);
