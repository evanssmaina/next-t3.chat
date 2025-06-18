"use client";

import { Icons } from "@/components/icons";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { ChatInput } from "./chat-input";
import { ChatInterface } from "./chat-interface";
import { useChat } from "./chat-provider";
import { InitialState } from "./initial-state";

export function Chat({ id }: { id?: string | undefined } = {}) {
  // Router
  const router = useRouter();

  // TRPC
  const trpc = useTRPC();

  const {
    chatId,
    attachments,
    isStartingChat,
    selectedModel,
    setSelectedModel,
    setAttachments,
    handleSubmit,
    handleValueChange,
    input,
    status,
    stop,
    reload,
    error,
    messages,
    setInitialMessages,
    setIsStartingChat,
  } = useChat();

  // Query
  const {
    data: fetchedMessages,
    isLoading,
    error: queryError,
  } = useQuery(
    trpc.message.getById.queryOptions(
      { chatId: chatId ?? "" },
      {
        enabled: isStartingChat,
        refetchOnWindowFocus: false,
      },
    ),
  );

  // Set messages when data is fetched
  useEffect(() => {
    if (isStartingChat) {
      // If messages exist, set them
      if (fetchedMessages) {
        setInitialMessages(fetchedMessages);
      }
    }

    if (queryError) {
      toast.error("Failed to load chat messages");
    }
  }, [isStartingChat, fetchedMessages, setInitialMessages]);

  const handleStartChat = useCallback(
    async (
      e?:
        | React.FormEvent<HTMLFormElement>
        | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    ) => {
      if (!input.trim() || status === "submitted") return;

      e?.preventDefault();
      e?.stopPropagation();

      setIsStartingChat(true);

      const chatId = await fetch("/api/chat/create", {
        method: "POST",
      }).then((res) => res.json());

      router.push(`/chat/${chatId}`);

      handleSubmit(e, {
        experimental_attachments: attachments,
        body: {
          chatId: chatId,
          model: selectedModel,
        },
      });

      setIsStartingChat(false);
    },
    [
      handleSubmit,
      input,
      status,
      router,
      chatId,
      setIsStartingChat,
      attachments,
      selectedModel,
    ],
  );

  const handleChatInterfaceSend = useCallback(
    (
      e?:
        | React.FormEvent<HTMLFormElement>
        | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    ) => {
      if (!input.trim() || status === "submitted") return;
      e?.preventDefault();
      e?.stopPropagation();

      handleSubmit(e, {
        experimental_attachments: attachments,
        body: {
          chatId: id,
          model: selectedModel,
        },
      });
    },
    [handleSubmit, input, status, id, attachments, selectedModel],
  );

  const handleStartChateKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handleStartChat();
      }
    },
    [handleStartChat],
  );

  const handleChatInterfaceKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handleChatInterfaceSend();
      }
    },
    [handleChatInterfaceSend],
  );

  return (
    <div className="flex h-screen justify-center flex-col overflow-hidden">
      {!isStartingChat && isLoading ? (
        // State 1: Loading an existing chat
        <div className="flex h-screen flex-col overflow-hidden justify-center">
          <div className="flex items-center justify-center flex-1 gap-2">
            <Icons.loader className="animate-spin size-5" /> Loading chats...
          </div>
        </div>
      ) : !isStartingChat && !chatId?.trim() ? (
        // State 2: Initial state for new chat
        <InitialState />
      ) : messages.length > 0 ? (
        // State 3: Chat has messages to display
        <ChatInterface
          messages={messages}
          error={error}
          reload={reload}
          status={status}
        />
      ) : (
        // State 4: No messages found
        <div className="flex h-screen flex-col overflow-hidden justify-center">
          <div className="flex items-center justify-center flex-1 gap-2">
            No messages found
          </div>
        </div>
      )}
      <div className="bg-background z-10 shrink-0 px-3 pb-3 md:px-5 md:pb-5">
        <div className="mx-auto max-w-3xl w-full">
          <ChatInput
            input={input}
            handleValueChange={handleValueChange}
            status={status}
            stop={stop}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            setAttachments={setAttachments}
            handleSend={
              messages.length > 0 ? handleChatInterfaceSend : handleStartChat
            }
            handleKeyDown={
              messages.length > 0
                ? handleChatInterfaceKeyDown
                : handleStartChateKeyDown
            }
          />
        </div>
      </div>
    </div>
  );
}
