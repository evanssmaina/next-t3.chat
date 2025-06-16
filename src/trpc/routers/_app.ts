import { router } from "@/trpc/init";
import { chatRouter } from "./chats";
import { messageRouter } from "./messages";

export const appRouter = router({
  message: messageRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
