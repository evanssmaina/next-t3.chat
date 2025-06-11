"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useTRPC } from "@/server/trpc/client";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { useDeferredValue } from "react";
import { historyParsers } from "./search-params";

export function ChatList() {
  const { isSignedIn } = useAuth();
  const trpc = useTRPC();
  const [query, _] = useQueryStates(historyParsers);

  const debouncedSearch = useDeferredValue(query.q);

  const {
    data: searchResults,
    isLoading,
    error,
  } = useQuery(
    trpc.chat.search.queryOptions({
      query: debouncedSearch,
    }),
  );

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center p-4">
        <p>Please Sign In in order to view chats</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <p>Loading chats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4">
        <p>Error loading chats: {error.message}</p>
      </div>
    );
  }

  // Ensure searchResults is an array
  const chats = Array.isArray(searchResults) ? searchResults : [];

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-4">
        {chats.length === 0 ? (
          <p className="text-center text-muted-foreground">No chats found</p>
        ) : (
          chats.map((chat) => (
            <div key={chat.id} className="border rounded-lg p-3">
              <div className="font-medium">{chat.content.title}</div>
              <div className="text-sm text-muted-foreground">
                {chat.metadata.createdAt}
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}
