import { stream, and, asc, db, eq } from "@/server/db";
import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const streamRouter = router({
  getStreamIdsByChatId: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { auth } = ctx;
      const { userId } = auth;
      const { chatId } = input;

      const streamIds = await db
        .select({ id: stream.id })
        .from(stream)
        .where(and(eq(stream.chatId, chatId), eq(stream.userId, userId)))
        .orderBy(asc(stream.createdAt))
        .execute();

      return streamIds.map(({ id }) => id);
    }),
});
