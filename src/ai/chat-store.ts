import { db } from "@/server/db";
import { chat, message } from "@/server/db/schemas";
import { getQueryClient, trpc } from "@/server/trpc/server";
import type { Message as AIMessage } from "ai";
import { and, asc, eq, inArray } from "drizzle-orm";

interface SaveChatParams {
  chatId: string;
  userId: string;
  messages: AIMessage[];
  aiModel: string;
}

export async function loadChatMessages(
  chatId: string,
  userId: string,
): Promise<AIMessage[]> {
  try {
    // Fetch all messages for this chat
    const messages = await db
      .select()
      .from(message)
      .where(and(eq(message.chatId, chatId), eq(message.userId, userId)))
      .orderBy(asc(message.createdAt))
      .execute();

    // Transform database messages to AI SDK message format
    const data = messages.map(({ chatId, aiModel, userId, ...rest }) => rest);

    return data;
  } catch (error) {
    console.error("Error loading chat messages:", error);
    return [];
  }
}

export async function saveChat({
  chatId,
  userId,
  messages,
  aiModel,
}: SaveChatParams) {
  if (!messages?.length) return;

  const queryClient = getQueryClient();

  return await db.transaction(async (tx) => {
    try {
      // Check if the chat exists
      const existingChat = await tx
        .select({ id: chat.id })
        .from(chat)
        .where(eq(chat.id, chatId))
        .execute();

      // If chat doesn't exist, create it
      if (existingChat.length === 0) {
        await tx.insert(chat).values({
          id: chatId,
          userId,
          title: "(New Chat)",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.chat.get.queryKey(),
        });
      } else {
        // Update the chat's updatedAt timestamp
        await tx
          .update(chat)
          .set({ updatedAt: new Date() })
          .where(eq(chat.id, chatId));

        queryClient.invalidateQueries({
          queryKey: trpc.chat.get.queryKey(),
        });
      }

      // Get existing messages
      const existingMessages = await tx
        .select()
        .from(message)
        .where(eq(message.chatId, chatId))
        .execute();

      // Create maps for faster lookups
      const existingMessageMap = new Map(
        existingMessages.map((msg) => [msg.id, msg]),
      );
      const newMessageMap = new Map(messages.map((msg) => [msg.id, msg]));

      // Find messages to delete (exist in DB but not in new messages)
      const messagesToDelete = existingMessages.filter(
        (msg) => !newMessageMap.has(msg.id),
      );

      // Find messages to insert (exist in new messages but not in DB)
      const messagesToInsert = messages.filter(
        (msg) => !existingMessageMap.has(msg.id),
      );

      // Find messages to update (exist in both but might have changed)
      const messagesToUpdate = messages.filter((msg) => {
        const existing = existingMessageMap.get(msg.id);
        if (!existing) return false;
        return (
          msg.content !== existing.content ||
          JSON.stringify(msg.parts) !== JSON.stringify(existing.parts) ||
          JSON.stringify(msg.annotations) !==
            JSON.stringify(existing.annotations) ||
          JSON.stringify(msg.experimental_attachments) !==
            JSON.stringify(existing.experimental_attachments)
        );
      });

      // Perform the necessary operations
      if (messagesToDelete.length > 0) {
        await tx.delete(message).where(
          and(
            eq(message.chatId, chatId),
            inArray(
              message.id,
              messagesToDelete.map((msg) => msg.id),
            ),
          ),
        );
        queryClient.invalidateQueries({
          queryKey: trpc.message.getById.queryKey({
            chatId: chatId,
          }),
        });
      }

      if (messagesToInsert.length > 0) {
        await tx.insert(message).values(
          messagesToInsert.map((msg) => ({
            id: msg.id,
            chatId: chatId,
            userId: userId,
            aiModel: aiModel,
            role: msg.role,
            content: msg.content,
            createdAt:
              msg.createdAt instanceof Date
                ? msg.createdAt
                : new Date(msg.createdAt || Date.now()),
            annotations: msg.annotations || [],
            parts: msg.parts || [],
            experimental_attachments: msg.experimental_attachments || [],
          })),
        );
        queryClient.invalidateQueries({
          queryKey: trpc.message.getById.queryKey({
            chatId: chatId,
          }),
        });
      }

      if (messagesToUpdate.length > 0) {
        for (const msg of messagesToUpdate) {
          await tx
            .update(message)
            .set({
              content: msg.content,
              annotations: msg.annotations || [],
              parts: msg.parts || [],
              experimental_attachments: msg.experimental_attachments || [],
            })
            .where(and(eq(message.chatId, chatId), eq(message.id, msg.id)));
        }
        queryClient.invalidateQueries({
          queryKey: trpc.message.getById.queryKey({
            chatId: chatId,
          }),
        });
      }

      // If this is the first time we're saving messages, generate a title
      if (existingChat.length === 0 && messages.length > 0) {
        const firstUserMessage = messages.find((msg) => msg.role === "user");
        if (firstUserMessage?.content) {
          const title =
            firstUserMessage.content.substring(0, 30) +
            (firstUserMessage.content.length > 30 ? "..." : "");

          await tx.update(chat).set({ title }).where(eq(chat.id, chatId));
        }
      }
    } catch (error) {
      console.error("Error saving chat:", error);
      throw error;
    }
  });
}
