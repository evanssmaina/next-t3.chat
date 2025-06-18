import { db } from "@/server/db";
import { stream, chat, message } from "@/server/db/schemas";
import { index } from "@/trpc/routers/chats";
import { getQueryClient } from "@/trpc/server";
import { trpc } from "@/trpc/server";
import { auth } from "@clerk/nextjs/server";
import type { Message as AIMessage } from "ai";
import { and, asc, eq, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

interface SaveChatParams {
  chatId: string;
  userId: string;
  messages: AIMessage[];
}

// Helper function to extract text content from a message
function extractMessageContent(message: AIMessage): string {
  if (typeof message.content === "string") {
    return message.content;
    // biome-ignore lint/style/noUselessElse: <explanation>
  } else if (Array.isArray(message.content)) {
    return message.content
      .map((content: { type: string; text: any }) =>
        content.type === "text" ? content.text : "",
      )
      .join(" ");
  }
  return "";
}

// Helper function to generate chat title from first user message
function generateChatTitle(messages: AIMessage[]): string {
  const firstUserMessage = messages.find((msg) => msg.role === "user");
  if (firstUserMessage?.content) {
    const content = extractMessageContent(firstUserMessage);
    return content.substring(0, 30) + (content.length > 30 ? "..." : "");
  }
  return "(New Chat)";
}

export async function loadPreviousMessages({
  chatId,
  userId,
}: { chatId: string; userId: string }) {
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
}

export async function saveChat({ chatId, userId, messages }: SaveChatParams) {
  if (!messages?.length) return;

  const queryClient = getQueryClient();

  return await db.transaction(async (tx) => {
    try {
      // Check if the chat exists
      const existingChat = await tx
        .select()
        .from(chat)
        .where(eq(chat.id, chatId))
        .execute();

      const chatTitle = generateChatTitle(messages);
      const isNewChat = existingChat.length === 0;

      // If chat doesn't exist, create it
      if (isNewChat) {
        await tx.insert(chat).values({
          id: chatId,
          userId,
          title: chatTitle,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        // Update the chat's updatedAt timestamp and title if needed
        await tx
          .update(chat)
          .set({
            updatedAt: new Date(),
            title: chatTitle, // Update title in case it changed
          })
          .where(eq(chat.id, chatId));
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
            JSON.stringify(existing.experimentalAttachments)
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

        // Delete messages from search index
        for (const msg of messagesToDelete) {
          try {
            await index.delete(`msg_${msg.id}`);
          } catch (error) {
            console.error(
              `Error deleting message ${msg.id} from search index:`,
              error,
            );
          }
        }

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
            role: msg.role,
            content: msg.content,
            createdAt:
              msg.createdAt instanceof Date
                ? msg.createdAt
                : new Date(msg.createdAt || Date.now()),
            annotations: msg.annotations || [],
            parts: msg.parts || [],
            experimentalAttachments: msg.experimental_attachments || [],
          })),
        );

        // Index new messages in search
        for (const msg of messagesToInsert) {
          const messageContent = extractMessageContent(msg);
          if (messageContent.trim()) {
            try {
              await index.upsert({
                id: `msg_${msg.id}`,
                content: {
                  content: messageContent,
                  role: msg.role,
                  chatTitle: chatTitle,
                },
                metadata: {
                  chatId: chatId,
                  userId: userId,
                  messageId: msg.id,
                  role: msg.role,
                  createdAt: (msg.createdAt instanceof Date
                    ? msg.createdAt
                    : new Date(msg.createdAt || Date.now())
                  ).toISOString(),
                  chatTitle: chatTitle,
                },
              });
            } catch (error) {
              console.error(`Error indexing message ${msg.id}:`, error);
            }
          }
        }

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
              experimentalAttachments: msg.experimental_attachments || [],
            })
            .where(and(eq(message.chatId, chatId), eq(message.id, msg.id)));

          // Update message in search index
          const messageContent = extractMessageContent(msg);
          if (messageContent.trim()) {
            try {
              await index.upsert({
                id: `msg_${msg.id}`,
                content: {
                  content: messageContent,
                  role: msg.role,
                  chatTitle: chatTitle,
                },
                metadata: {
                  chatId: chatId,
                  userId: userId,
                  messageId: msg.id,
                  role: msg.role,
                  createdAt: (msg.createdAt instanceof Date
                    ? msg.createdAt
                    : new Date(msg.createdAt || Date.now())
                  ).toISOString(),
                  chatTitle: chatTitle,
                },
              });
            } catch (error) {
              console.error(
                `Error updating message ${msg.id} in search index:`,
                error,
              );
            }
          }
        }

        queryClient.invalidateQueries({
          queryKey: trpc.message.getById.queryKey({
            chatId: chatId,
          }),
        });
      }

      // Also maintain the chat-level index for chat listing
      await index.upsert({
        id: `chat_${chatId}`,
        content: {
          title: chatTitle,
        },
        metadata: {
          createdAt: isNewChat
            ? new Date().toISOString()
            : existingChat[0]?.createdAt.toISOString() ||
              new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: userId,
          messageCount: messages.length,
          type: "chat", // Distinguish from message entries
        },
      });

      // Invalidate chat search queries
      queryClient.invalidateQueries({
        queryKey: trpc.chat.search.queryKey(),
      });
    } catch (error) {
      console.error("Error saving chat:", error);
      throw error;
    }
  });
}

export async function getStreamIdsByChatId({
  chatId,
  userId,
}: { chatId: string; userId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(and(eq(stream.chatId, chatId), eq(stream.userId, userId)))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (error) {
    console.error("Error getting streamId:", error);
    throw error;
  }
}

export async function createStreamId({
  chatId,
  userId,
}: {
  chatId: string;
  userId: string;
}) {
  try {
    await db.insert(stream).values({ chatId, userId, createdAt: new Date() });
  } catch (error) {
    console.error("Error creating streamId:", error);
    throw error;
  }
}

export async function createChat() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const [data] = await db
    .insert(chat)
    .values({
      id: uuidv4(),
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      title: "New Chat",
    })
    .returning({ id: chat.id })
    .execute();

  console.log(data.id);

  return data.id;
}
