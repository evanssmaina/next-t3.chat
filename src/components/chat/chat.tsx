"use client";

import { trpc } from "@/server/trpc/server";
import { generateId } from "@/utils/generate-id";
import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { createIdGenerator } from "ai";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback } from "react";
import { ChatCards } from "../chat-cards";
import { ChatInput } from "./chat-input";
import { ChatInterface } from "./chat-interface";
import { InitialState } from "./initial-state";

export function Chat() {
  const [activeChat, setActiveChat] = useQueryState(
    "chat",
    parseAsString.withDefault(""),
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
  } = useChat({
    id: activeChat,
    sendExtraMessageFields: true,
    generateId: createIdGenerator({
      prefix: "msgc",
      separator: "_",
    }),
    experimental_prepareRequestBody: ({ messages }) => {
      const requestBody = {
        message: messages[messages.length - 1],
        chatId: activeChat,
      };
      return requestBody;
    },
  });

  const handleValueChange = useCallback(
    (value: string) => setInput(value),
    [setInput],
  );

  const handleStartChat = useCallback(
    (
      e?:
        | React.FormEvent<HTMLFormElement>
        | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    ) => {
      if (!input.trim() || status === "submitted") return;

      e?.preventDefault();
      e?.stopPropagation();

      const chatId = generateId("chat");
      setActiveChat(chatId);

      handleSubmit();
    },
    [handleSubmit, input, status, generateId],
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

      handleSubmit();
    },
    [handleSubmit, input, status],
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
    <main className="flex h-screen flex-col overflow-hidden">
      {activeChat?.trim() ? (
        <ChatInterface
          messages={messages}
          error={error}
          reload={reload}
          status={status}
        />
      ) : (
        <div className="mx-auto max-w-3xl w-full  text-center  mb-8 space-y-5 mt-40">
          <InitialState />
        </div>
      )}

      <div className="bg-background z-10 shrink-0 px-3 pb-3 md:px-5 md:pb-5">
        <div className="mx-auto max-w-3xl">
          <ChatInput
            input={input}
            handleValueChange={handleValueChange}
            status={status}
            stop={stop}
            handleSend={
              activeChat?.trim() ? handleChatInterfaceSend : handleStartChat
            }
            handleKeyDown={
              activeChat?.trim()
                ? handleChatInterfaceKeyDown
                : handleStartChateKeyDown
            }
          />
          {!activeChat?.trim() && <ChatCards />}
        </div>
      </div>
    </main>
  );
}
