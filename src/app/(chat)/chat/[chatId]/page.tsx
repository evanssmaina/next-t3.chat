"use client";

import { Chat } from "@/components/chat/chat";
import { useChat } from "@/components/chat/chat-provider";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import type { Message } from "ai";
import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function ChatPage() {
  const trpc = useTRPC();
  const { isNewChat, setIsNewChat, chatId, setChatId } = useChat();
  const params = useParams<{ chatId: string }>();

  const urlChatId = params.chatId;

  // Memoize this calculation to avoid recalculating on every render
  const isCurrentlyNewChat = useMemo(() => {
    return isNewChat && urlChatId === chatId;
  }, [isNewChat, urlChatId, chatId]);

  // Sync URL with provider state and handle new chat logic
  useEffect(() => {
    if (!urlChatId) return;

    console.log("Debug:", {
      urlChatId,
      chatId,
      isNewChat,
      isCurrentlyNewChat,
    });

    if (isCurrentlyNewChat) {
      console.log("New chat detected - no API call needed");
      setIsNewChat(false);
      return;
    }

    // Sync provider state with URL
    if (urlChatId !== chatId) {
      console.log("Syncing chatId with URL");
      setChatId(urlChatId);
    }
  }, [
    urlChatId,
    chatId,
    setChatId,
    isNewChat,
    setIsNewChat,
    isCurrentlyNewChat,
  ]);

  // Only fetch when we have a chatId and it's not a new chat
  const shouldFetch = !isCurrentlyNewChat && !!chatId;

  const {
    data: fetchedMessages,
    isLoading,
    error: queryError,
  } = useQuery(
    trpc.message.getById.queryOptions(
      { chatId: chatId },
      {
        enabled: shouldFetch,
        // Add some additional options for better UX
        staleTime: 30000, // Consider data fresh for 30 seconds
        retry: (failureCount, error) => {
          // Don't retry if it's a 404 (chat doesn't exist)
          if (
            error?.message?.includes("404") ||
            error?.message?.includes("not found")
          ) {
            return false;
          }
          return failureCount < 3;
        },
      },
    ),
  );

  // Show loading only when actually fetching data
  if (isLoading && shouldFetch) {
    console.log(isLoading, shouldFetch);
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <p>Failed to load chat: {queryError.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // For new chats, pass empty array. For existing chats, pass fetched messages or empty array
  const initialMessages = isCurrentlyNewChat ? [] : fetchedMessages || [];

  return <Chat id={chatId} initialMessages={initialMessages} />;
}
