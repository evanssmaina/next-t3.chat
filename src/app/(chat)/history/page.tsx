import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { HydrateClient, prefetch, trpc } from "@/server/trpc/server";
import Link from "next/link";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { ChatList } from "./chats-list";
import { HistorySearch } from "./history-search";
import { historyCacheParams } from "./search-params";

export default async function History({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filters = historyCacheParams.parse(params);

  prefetch(
    trpc.chat.search.queryOptions({
      query: filters.q,
    }),
  );

  return (
    <div className="w-full max-w-3xl mx-auto mt-20 min-h-screen">
      <div className="mb-5 py-5 bg-background ">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-3xl mb-5">Your chat history</h1>
          <Button variant={"secondary"} asChild>
            <Link href="/">
              <Icons.plus />
              New Chat
            </Link>
          </Button>
        </div>
        <Suspense>
          <HistorySearch />
        </Suspense>
      </div>
      <HydrateClient>
        <Suspense>
          <ChatList />
        </Suspense>
      </HydrateClient>
    </div>
  );
}

export const chats = [
  {
    id: "chat_001",
    content: {
      title: "Project Planning Discussion",
    },
    metadata: {
      createdAt: "2025-06-08T14:30:00Z",
    },
  },
  {
    id: "chat_002",
    content: {
      title: "Weekend Trip Ideas",
    },
    metadata: {
      createdAt: "2025-06-08T16:45:12Z",
    },
  },
  {
    id: "chat_003",
    content: {
      title: "Recipe Recommendations",
    },
    metadata: {
      createdAt: "2025-06-09T09:15:30Z",
    },
  },
  {
    id: "chat_004",
    content: {
      title: "JavaScript Help",
    },
    metadata: {
      createdAt: "2025-06-09T11:22:45Z",
    },
  },
  {
    id: "chat_005",
    content: {
      title: "Book Club Discussion",
    },
    metadata: {
      createdAt: "2025-06-09T13:10:18Z",
    },
  },
  {
    id: "chat_006",
    content: {
      title: "Workout Routine Planning",
    },
    metadata: {
      createdAt: "2025-06-09T15:33:27Z",
    },
  },
  {
    id: "chat_007",
    content: {
      title: "Career Advice Session",
    },
    metadata: {
      createdAt: "2025-06-09T17:55:03Z",
    },
  },
  {
    id: "chat_008",
    content: {
      title: "Home Renovation Ideas",
    },
    metadata: {
      createdAt: "2025-06-09T19:12:41Z",
    },
  },
  {
    id: "chat_009",
    content: {
      title: "Investment Strategy",
    },
    metadata: {
      createdAt: "2025-06-09T21:08:15Z",
    },
  },
  {
    id: "chat_010",
    content: {
      title: "Language Learning Tips",
    },
    metadata: {
      createdAt: "2025-06-10T07:25:33Z",
    },
  },
  {
    id: "chat_011",
    content: {
      title: "Photography Techniques",
    },
    metadata: {
      createdAt: "2025-06-10T08:42:19Z",
    },
  },
  {
    id: "chat_012",
    content: {
      title: "Gardening Advice",
    },
    metadata: {
      createdAt: "2025-06-10T09:18:47Z",
    },
  },
  {
    id: "chat_013",
    content: {
      title: "Travel Budget Planning",
    },
    metadata: {
      createdAt: "2025-06-10T10:05:22Z",
    },
  },
  {
    id: "chat_014",
    content: {
      title: "Tech News Discussion",
    },
    metadata: {
      createdAt: "2025-06-10T10:31:56Z",
    },
  },
  {
    id: "chat_015",
    content: {
      title: "Movie Recommendations",
    },
    metadata: {
      createdAt: "2025-06-10T11:02:14Z",
    },
  },
  {
    id: "chat_016",
    content: {
      title: "Healthy Meal Prep",
    },
    metadata: {
      createdAt: "2025-06-10T11:15:38Z",
    },
  },
  {
    id: "chat_017",
    content: {
      title: "Study Schedule Help",
    },
    metadata: {
      createdAt: "2025-06-10T11:28:05Z",
    },
  },
  {
    id: "chat_018",
    content: {
      title: "Pet Care Questions",
    },
    metadata: {
      createdAt: "2025-06-10T11:31:42Z",
    },
  },
  {
    id: "chat_019",
    content: {
      title: "Music Production Tips",
    },
    metadata: {
      createdAt: "2025-06-10T11:34:17Z",
    },
  },
  {
    id: "chat_020",
    content: {
      title: "Quick Math Problem",
    },
    metadata: {
      createdAt: "2025-06-10T11:35:55Z",
    },
  },
];
