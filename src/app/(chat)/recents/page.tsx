import { Await } from "@/components/await";
import { ErrorFallback } from "@/components/error-fallback";
import { Icons } from "@/components/icons";
import { ChatList } from "@/components/recents/chats-list";
import { SearchInput } from "@/components/recents/search-input";
import { Button } from "@/components/ui/button";
import { HydrateClient, prefetch } from "@/trpc/server";
import { trpc } from "@/trpc/server-utils";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "recent chats",
};

export default function Recents() {
  prefetch(
    trpc.chat.search.infiniteQueryOptions(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    ),
  );

  return (
    <div className="w-full max-w-3xl mx-auto mt-20 h-full">
      <div className="mb-5 py-5 bg-background ">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-3xl mb-5">Your chat history</h1>
          <Button asChild>
            <Link href="/">
              <Icons.plus />
              New Chat
            </Link>
          </Button>
        </div>
        <Suspense>
          <SearchInput />
        </Suspense>
      </div>
      <HydrateClient>
        <Await
          fallback={
            <div className="p-5 w-full mx-auto">
              <Icons.loader className="animate-spin size-5" />
            </div>
          }
          errorComponent={<ErrorFallback />}
        >
          <ChatList />
        </Await>
      </HydrateClient>
    </div>
  );
}
