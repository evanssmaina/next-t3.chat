import { createTRPCRouter } from "@/server/trpc/init";
import { chatRouter } from "./chats";
import { messageRouter } from "./messages";
import { metadataRouter } from "./metadata";

export const appRouter = createTRPCRouter({
  chat: chatRouter,
  message: messageRouter,
  metadata: metadataRouter,
});

export type AppRouter = typeof appRouter;
