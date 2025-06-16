import "server-only";

import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { createContext } from "./init";
import { appRouter } from "./routers/_app";
import { getQueryClient } from "./server";

// Server-side tRPC utilities
export const trpc = createTRPCOptionsProxy({
  ctx: createContext,
  router: appRouter,
  queryClient: getQueryClient,
});

export const caller = appRouter.createCaller(createContext);
