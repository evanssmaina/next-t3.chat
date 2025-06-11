import { asc, db, eq, message } from "@/server/db";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";
import { z } from "zod/v4";

export const messageRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(
      z.object({
        chatId: z.string().min(4).startsWith("chat_"),
      }),
    )
    .query(async ({ input }) => {
      const { chatId } = input;

      const messages = await db
        .select()
        .from(message)
        .where(eq(message.chatId, chatId))
        .orderBy(asc(message.createdAt))
        .execute();

      const data = messages.map(({ chatId, userId, aiModel, ...rest }) => rest);

      return data;
    }),
});

export type MessageRouter = typeof messageRouter;
