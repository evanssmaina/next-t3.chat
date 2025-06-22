"use client";

import type { Message } from "ai";
import { useCallback, useEffect } from "react";
import { ChatInput } from "./chat-input";
import { ChatInterface } from "./chat-interface";
import { useChat } from "./chat-provider";
import { InitialState } from "./initial-state";

export function Chat({
  id,
  initialMessages,
}: { id?: string | undefined; initialMessages?: Message[] | undefined } = {}) {
  const {
    isNewChat,
    selectedModel,
    setSelectedModel,
    setAttachments,
    handleValueChange,
    input,
    status,
    stop,
    reload,
    error,
    messages,
    setInitialMessages,
    handleStartChat,
    handleChatInterfaceSend,
  } = useChat();

  const showInitialInterface = isNewChat || !id;

  useEffect(() => {
    setInitialMessages(initialMessages);
  }, [initialMessages]);

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
      {showInitialInterface ? (
        <InitialState />
      ) : (
        <ChatInterface
          messages={messages}
          error={error}
          reload={reload}
          status={status}
        />
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
