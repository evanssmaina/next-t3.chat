"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRecentsParams } from "@/hooks/use-recents-params";
import { useTRPC } from "@/trpc/client";
import { FADE_ANIMATION } from "@/utils/animation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bot, MessageSquare, Search, User } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Icons } from "../icons";

export function ChatList() {
  const router = useRouter();
  const trpc = useTRPC();
  const { query } = useRecentsParams();

  const hasSearchQuery = query?.trim().length > 0;

  const {
    data: searchResults,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery(
    trpc.chat.search.infiniteQueryOptions(
      {
        limit: 10,
        query: hasSearchQuery ? query : undefined,
      },
      {
        initialCursor: "0",
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    ),
  );

  const chats = useMemo(() => {
    return searchResults?.pages.flatMap((page) => page.documents) ?? [];
  }, [searchResults]);

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;

    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "user":
        return <User className="w-3 h-3" />;
      case "assistant":
        return <Bot className="w-3 h-3" />;
      default:
        return <MessageSquare className="w-3 h-3" />;
    }
  };

  return (
    <ScrollArea className="h-[700px] overflow-y-auto pb-10">
      <motion.div className="space-y-3" {...FADE_ANIMATION}>
        {/* Search results header */}
        {hasSearchQuery && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Search className="w-4 h-4" />
            <span>
              {chats.length === 0
                ? `No results found for "${query}"`
                : `Found ${chats.length} ${chats.length === 1 ? "chat" : "chats"} matching "${query}"`}
            </span>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center flex-1 gap-2">
            <Icons.loader className="animate-spin size-5" />
          </div>
        )}

        {chats?.map((chat) => (
          <div
            onClick={() => router.push(`/?chat=${chat.id}`)}
            key={chat.id}
            className="border rounded-xl py-4 px-6 cursor-pointer hover:bg-muted/50 duration-150 ease-in-out transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Chat title */}
                <div className="font-medium mb-2">
                  {highlightSearchTerm(
                    chat.content.title || "Untitled Chat",
                    query,
                  )}
                </div>

                {/* Show matched message content if this was a message match */}
                {chat.content.matchedContent && hasSearchQuery && (
                  <div className="bg-muted/30 rounded-lg p-3 mb-3 border-l-2 border-primary/30">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      {getRoleIcon(chat.content.matchedRole || "")}
                      <span className="capitalize">
                        {chat.content.matchedRole}
                      </span>
                      <span>•</span>
                      <span>Message match</span>
                    </div>
                    <div className="text-sm">
                      {highlightSearchTerm(
                        chat.content.matchedContent.length > 150
                          ? chat.content.matchedContent.substring(0, 150) +
                              "..."
                          : chat.content.matchedContent,
                        query,
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {chat.metadata?.updatedAt ? "Updated" : "Created"}{" "}
                    {formatDistanceToNow(
                      new Date(
                        chat.metadata?.updatedAt ||
                          (chat.metadata?.createdAt as string),
                      ),
                      { addSuffix: true },
                    )}
                  </span>

                  {/* Message count badge */}
                  {chat.metadata?.messageCount && (
                    <>
                      <span>•</span>
                      <Badge variant="secondary" className="text-xs">
                        {chat.metadata.messageCount} messages
                      </Badge>
                    </>
                  )}

                  {/* Search relevance score */}
                  {hasSearchQuery &&
                    "score" in chat &&
                    chat.score !== undefined && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(chat.score * 100)}% match
                        </Badge>
                      </>
                    )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* No results message */}
        {chats.length === 0 && (
          <div className="text-center py-12 rounded-lg text-muted-foreground border">
            {hasSearchQuery ? (
              <div>
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No chats found matching "{query}"</p>
                <p className="text-sm mt-1">
                  We searched through both chat titles and message content
                </p>
              </div>
            ) : (
              <div>
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No chats yet</p>
                <p className="text-sm mt-1">
                  Start a conversation to see your chats here
                </p>
              </div>
            )}
          </div>
        )}

        {/* Load more button for browsing (not search) */}
        {!hasSearchQuery && hasNextPage && chats.length > 0 && (
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage || !hasNextPage}
            className="w-fit mt-5"
          >
            {isFetchingNextPage ? "Loading more..." : "Load more"}
          </Button>
        )}
      </motion.div>
    </ScrollArea>
  );
}
