"use client";

import type { Message } from "ai";
import { useEffect } from "react";
import { ChatInput } from "./chat-input";
import { ChatInterface } from "./chat-interface";
import { useChat } from "./chat-provider";
import { InitialState } from "./initial-state";

export function Chat({
  id,
  initialMessages,
}: { id?: string | undefined; initialMessages?: Message[] | undefined } = {}) {
  const { isNewChat, setInitialMessages } = useChat();

  const showInitialInterface = isNewChat || !id;

  useEffect(() => {
    setInitialMessages(initialMessages);
  }, [initialMessages]);

  return (
    <div className="flex flex-col overflow-hidden h-full">
      {showInitialInterface ? <InitialState /> : <ChatInterface />}

      <div className="bg-background z-10 shrink-0 px-3 pb-3 md:px-5 md:pb-5">
        <div className="mx-auto max-w-2xl w-full">
          <ChatInput />
        </div>
      </div>
    </div>
  );
}
