"use client";

import { Chat } from "@/components/chat/chat";
import { useChat } from "@/components/chat/chat-provider";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function ChatPage() {
  const trpc = useTRPC();
  const { isNewChat, setIsNewChat, chatId, setChatId } = useChat();
  const params = useParams<{ chatId: string }>();

  const urlChatId = params.chatId;

  // Improved logic for determining if this is a new chat
  const isCurrentlyNewChat = useMemo(() => {
    // If we have a URL chatId and it matches the provider's chatId, and isNewChat is true
    return isNewChat && urlChatId && urlChatId === chatId;
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

    // If this is a new chat, reset the flag and don't fetch
    if (isCurrentlyNewChat) {
      console.log("New chat detected - no API call needed");
      setIsNewChat(false);
      return;
    }

    // Sync provider state with URL if they don't match
    if (urlChatId !== chatId) {
      console.log("Syncing chatId with URL");
      setChatId(urlChatId);
      // Reset isNewChat when navigating to an existing chat
      if (isNewChat) {
        setIsNewChat(false);
      }
    }
  }, [
    urlChatId,
    chatId,
    setChatId,
    isNewChat,
    setIsNewChat,
    isCurrentlyNewChat,
  ]);

  // Determine if we should fetch data
  const shouldFetch = useMemo(() => {
    return (
      !!urlChatId && // We have a URL chatId
      !isCurrentlyNewChat && // It's not a new chat
      urlChatId === chatId // The URL matches our provider state
    );
  }, [urlChatId, isCurrentlyNewChat, chatId]);

  const {
    data: fetchedMessages,
    isLoading,
    error: queryError,
  } = useQuery(
    trpc.message.getById.queryOptions(
      { chatId: chatId },
      {
        enabled: shouldFetch,
        staleTime: 30000,
        retry: (failureCount, error) => {
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

  // Show loading only when we should be fetching and are actually loading
  if (shouldFetch && isLoading) {
    console.log("Showing loading spinner:", { isLoading, shouldFetch });
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (queryError && shouldFetch) {
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

  // For new chats or when we don't have data yet, use empty array
  const initialMessages = isCurrentlyNewChat ? [] : fetchedMessages || [];

  return <Chat id={chatId} initialMessages={initialMessages} />;
}
