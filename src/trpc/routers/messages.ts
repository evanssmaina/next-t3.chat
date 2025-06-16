import { loadPreviousMessages } from "@/ai/chat-store";
import { protectedProcedure, router } from "@/trpc/init";
import { z } from "zod";

export const messageRouter = router({
  getById: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { auth } = ctx;
      const { userId } = auth;
      const { chatId } = input;

      try {
        const messages = await loadPreviousMessages({ chatId, userId });

        return messages;
      } catch (error) {
        console.error("Database query error:", error);
      }
    }),
});

export type MessageRouter = typeof messageRouter;
