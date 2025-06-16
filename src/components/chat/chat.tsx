"use client";

import { availableModels } from "@/ai/providers";
import { Icons } from "@/components/icons";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useTRPC } from "@/trpc/client";
import { generateId } from "@/utils/generate-id";
import { type UseChatOptions, useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { type Attachment, type UIMessage, createIdGenerator } from "ai";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChatInput } from "./chat-input";
import { ChatInterface } from "./chat-interface";
import { InitialState } from "./initial-state";

export function Chat() {
  const trpc = useTRPC();

  const [chatId, setChatId] = useQueryState(
    "chat",
    parseAsString.withDefault(""),
  );
  const [selectedModel, setSelectedModel] = useLocalStorage(
    "next-t3-chat-selected-model",
    availableModels[0].id,
  );
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const {
    data: fetchedMessages,
    isLoading,
    error: queryError,
  } = useQuery(
    trpc.message.getById.queryOptions(
      { chatId },
      {
        enabled: !!chatId?.trim() && !isStartingChat,
        refetchOnWindowFocus: false,
      },
    ),
  );

  const chatOptions: UseChatOptions = useMemo(
    () => ({
      id: chatId ?? undefined,
      sendExtraMessageFields: true,
      experimental_throttle: 50,
      generateId: createIdGenerator({
        prefix: "msgc",
        separator: "_",
      }),
      experimental_prepareRequestBody: ({
        messages,
      }: { messages: UIMessage[] }) => {
        const requestBody = {
          message: messages[messages.length - 1],
          chatId: chatId,
          model: selectedModel,
        };
        return requestBody;
      },
      onError: (error) => {
        console.log(error.message);
        toast.error("An error occured, please try again later");
      },
    }),
    [chatId, selectedModel],
  );

  const {
    input,
    error,
    messages,
    reload,
    status,
    stop,
    setInput,
    handleSubmit,
    setMessages,
    experimental_resume,
    data,
  } = useChat(chatOptions);

  useAutoResume({
    autoResume: true,
    initialMessages: [],
    experimental_resume,
    data,
    setMessages,
  });

  // Set messages when data is fetched
  useEffect(() => {
    if (chatId?.trim() && fetchedMessages && !isStartingChat) {
      // If messages exist, set them
      if (fetchedMessages.length > 0) {
        setMessages(fetchedMessages);
      }
    }

    if (queryError) {
      toast.error("Failed to load chat messages");
    }
  }, [chatId, fetchedMessages, setMessages, queryError]);

  const handleValueChange = useCallback(
    (value: string) => setInput(value),
    [setInput],
  );

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
      const id = generateId("chat");
      await setChatId(id);

      console.log(attachments);
      handleSubmit(e, {
        experimental_attachments: attachments,
      });

      setIsStartingChat(false);
    },
    [handleSubmit, input, status, setChatId, setIsStartingChat, attachments],
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

      console.log(attachments);
      handleSubmit(e, {
        experimental_attachments: attachments,
      });
    },
    [handleSubmit, input, status, attachments],
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
    <main className="flex h-screen flex-col overflow-hidden justify-center">
      {chatId?.trim() && !isStartingChat && isLoading && messages.length === 0 ? (
        // State 1: Loading an existing chat
        <div className="flex h-screen flex-col overflow-hidden justify-center">
          <div className="flex items-center justify-center flex-1 gap-2">
            <Icons.loader className="animate-spin size-5" /> Loading chats...
          </div>
        </div>
      ) : messages.length > 0 ? (
        // State 2: Chat has messages to display
        <ChatInterface
          messages={messages}
          error={error}
          reload={reload}
          status={status}
        />
      ) : (
        // State 3: No messages, show the initial empty state
        <InitialState />
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
    </main>
  );
}
