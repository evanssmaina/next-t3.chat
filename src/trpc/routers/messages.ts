import { and, db, eq, message } from "@/server/db";
import { protectedProcedure, router } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
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
        const messages = await db
          .select()
          .from(message)
          .where(and(eq(message.chatId, chatId), eq(message.userId, userId)))
          .execute();

        const data = messages.map(
          ({ chatId, userId, experimentalAttachments, ...rest }) => ({
            ...rest,
            experimental_attachments: experimentalAttachments,
          }),
        );

        return data;
      } catch (error) {
        console.error("Database query error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch messages",
        });
      }
    }),
});

export type MessageRouter = typeof messageRouter;
