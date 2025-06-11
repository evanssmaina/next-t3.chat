import { upstashSearch } from "@/lib/search";
import { chat, db, desc, eq } from "@/server/db";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";
import { z } from "zod/v4";

type Content = { title: string };
type Metadata = { createdAt: string };

interface SearchResult {
  id: string;
  content: Content;
  metadata: Metadata;
}

const index = upstashSearch.index("search");

export const chatRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { auth } = ctx;
      const { userId } = auth;
      const { limit } = input;

      const data = await db.query.chat.findMany({
        where: eq(chat.userId, userId),
        orderBy: desc(chat.updatedAt),
        limit: limit,
      });

      return data;
    }),
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().default(""),
      }),
    )
    .query(async ({ input }) => {
      const { query } = input;

      const results = await index.search({ query, limit: 10 });

      const data = JSON.stringify(results);

      return data as unknown as SearchResult[];
    }),
});

export type ChatRouter = typeof chatRouter;
