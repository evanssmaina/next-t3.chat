import { createTRPCContext, log } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
    onError: (opts) => {
      const { error, type, path, input, ctx, req } = opts;
      log.error("TRPC Error:", {
        error,
        type,
        path,
        input,
        ctx,
        req,
      });
    },
  });

export { handler as GET, handler as POST };
