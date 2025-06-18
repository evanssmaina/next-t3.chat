import { upstashSearch } from "@/lib/search";
import { and, chat, db, eq } from "@/server/db";
import { protectedProcedure, router } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

// Content types for different document types in the index
type Content = {
  // For chat documents
  title?: string;

  // For message documents
  content?: string;
  role?: string;
  chatTitle?: string;
};

type Metadata = {
  createdAt: string;
  updatedAt?: string;
  userId: string;

  // For chat documents
  messageCount?: number;
  type?: "chat" | "message";

  // For message documents
  chatId?: string;
  messageId?: string;
  role?: string;
  chatTitle?: string;
};

export const index = upstashSearch.index<Content, Metadata>("chats-messages");

export const chatRouter = router({
  // Create a new chat
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { auth } = ctx;
      const { userId } = auth;
      const { title } = input;

      try {
        const data = await db
          .insert(chat)
          .values({
            userId,
            title,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .execute();

        return data;
      } catch (error) {
        console.error("Database insert error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create chat",
        });
      }
    }),

  get: protectedProcedure.query(async ({ input, ctx }) => {
    const { auth } = ctx;
    const { userId } = auth;

    try {
      const data = await db.query.chat.findMany({
        where: eq(chat.userId, userId),
        limit: 20,
        orderBy: (chat, { desc }) => [desc(chat.createdAt)],
      });

      return data;
    } catch (error) {
      console.error("Database query error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch chat",
      });
    }
  }),

  getById: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { chatId } = input;
      const { auth } = ctx;
      const { userId } = auth;

      try {
        const data = await db.query.chat.findFirst({
          where: and(eq(chat.userId, userId), eq(chat.id, chatId)),
        });

        return data;
      } catch (error) {
        console.error("Database query error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch chat",
        });
      }
    }),

  search: protectedProcedure
    .input(
      z.object({
        cursor: z.string().nullish(),
        limit: z.number().min(1).max(100).nullish(),
        query: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { cursor, limit, query } = input;
      const { auth } = ctx;
      const { userId } = auth;

      // If there's a search query, search across all content but group by chat
      if (query && query.trim()) {
        const searchResults = await index.search({
          query,
          limit: (limit || 10) * 3, // Get more results to account for grouping
          filter: `metadata.userId = '${userId}'`,
          reranking: true,
        });

        // Group results by chatId and get the best match per chat
        const chatResults = new Map();

        for (const result of searchResults) {
          const isChat = result.metadata?.type === "chat";
          const chatId = isChat
            ? result.id.replace("chat_", "")
            : result.metadata?.chatId;

          if (!chatId) continue;

          if (
            !chatResults.has(chatId) ||
            result.score > chatResults.get(chatId).score
          ) {
            chatResults.set(chatId, {
              id: chatId,
              content: {
                title: isChat
                  ? result.content.title
                  : result.metadata?.chatTitle,
                matchedContent: isChat ? null : result.content.content,
                matchedRole: isChat ? null : result.content.role,
              },
              metadata: {
                createdAt: result.metadata?.createdAt,
                updatedAt: result.metadata?.updatedAt,
                userId: result.metadata?.userId,
                messageCount: result.metadata?.messageCount,
              },
              score: result.score,
            });
          }
        }

        const sortedResults = Array.from(chatResults.values())
          .sort((a, b) => b.score - a.score)
          .slice(0, limit || 10);

        return {
          documents: sortedResults,
          nextCursor: null,
        };
      }

      // Otherwise, use range query for listing chat documents only
      const results = await index.range({
        limit: limit as number,
        prefix: `chat_`,
        cursor: cursor as string,
      });

      // Filter by userId and chat type
      const filteredResults = results.documents.filter(
        (doc) =>
          doc.metadata?.userId === userId && doc.metadata?.type === "chat",
      );

      return {
        documents: filteredResults.map((doc) => ({
          id: doc.id.replace("chat_", ""),
          content: doc.content.title,
          metadata: doc.metadata,
        })),
        nextCursor: results.nextCursor,
      };
    }),

  // Search specifically within messages
  searchMessages: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(100).default(20),
        chatId: z.string().optional(), // Optional: search within specific chat
      }),
    )
    .query(async ({ input, ctx }) => {
      const { query, limit, chatId } = input;
      const { auth } = ctx;
      const { userId } = auth;

      let filter = `metadata.userId = '${userId}' AND metadata.type = 'message'`;
      if (chatId) {
        filter += ` AND metadata.chatId = '${chatId}'`;
      }

      const searchResults = await index.search({
        query,
        limit,
        filter,
      });

      return searchResults.map((result) => ({
        id: result.metadata?.messageId,
        chatId: result.metadata?.chatId,
        content: result.content.content,
        role: result.content.role,
        chatTitle: result.metadata?.chatTitle,
        createdAt: result.metadata?.createdAt,
        score: result.score,
      }));
    }),

  // Get all messages for a specific chat (useful for context)
  getMessagesByChat: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { chatId, limit } = input;
      const { auth } = ctx;
      const { userId } = auth;

      const results = await index.range({
        limit: limit,
        prefix: `msg_`,
        cursor: "",
      });

      // Filter by userId and chatId
      const filteredResults = results.documents.filter(
        (doc) =>
          doc.metadata?.userId === userId &&
          doc.metadata?.chatId === chatId &&
          doc.metadata?.type === "message",
      );

      return filteredResults
        .map((doc) => ({
          id: doc.metadata?.messageId,
          content: doc.content.content,
          role: doc.content.role,
          createdAt: doc.metadata?.createdAt,
        }))
        .sort(
          (a, b) =>
            new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime(),
        );
    }),
});

export type ChatRouter = typeof chatRouter;
