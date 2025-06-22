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
      const { auth, logger } = ctx;
      const { userId } = auth;
      const { chatId } = input;

      try {
        logger.info("Fetching messages for chatId from db:", chatId);
        const messages = await db
          .select()
          .from(message)
          .where(and(eq(message.chatId, chatId), eq(message.userId, userId)))
          .execute();

        logger.info("Fetched messages for chatId from db:", chatId);

        logger.info("Mapping messages:", messages);
        const data = messages.map(
          ({ chatId, userId, experimentalAttachments, ...rest }) => ({
            ...rest,
            experimental_attachments: experimentalAttachments,
          }),
        );

        logger.info("Mapped messages:", data);

        return data;
      } catch (error) {
        logger.error("Database query error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch messages",
        });
      }
    }),
});

export type MessageRouter = typeof messageRouter;
