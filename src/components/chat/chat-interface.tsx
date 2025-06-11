"use client";

import { cn } from "@/lib/utils";
import type { ChatRequestOptions, UIMessage } from "ai";
import { useRef } from "react";
import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from "../ui/chat-container";
import { Markdown } from "../ui/markdown";
import { Message as MessageComponent, MessageContent } from "../ui/message";
import { ScrollButton } from "../ui/scroll-button";
import { AIErrorMessage } from "./ai-error-messge";
import { AILoading } from "./ai-loading";
import { AIMessageFooter } from "./ai-message-footer";
import { markdownComponents } from "./markdown-components";

interface ChatInterfaceProps {
  reload: (
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  messages: UIMessage[];
  error: Error | undefined;
  status: "submitted" | "error" | "ready" | "streaming";
}

export function ChatInterface({
  messages,
  error,
  reload,
  status,
}: ChatInterfaceProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={chatContainerRef} className="relative flex-1 overflow-y-auto">
      <ChatContainerRoot className="h-full">
        <ChatContainerContent className="space-y-10  px-5 py-20">
          {messages.map((message, index) => {
            const isLoading = status === "streaming";
            const isLastMessage = index === messages.length - 1;
            const isCurrentlyStreaming = isLastMessage && isLoading;

            return (
              <MessageComponent
                key={message.id}
                className={cn(
                  message.role === "user" ? "justify-end" : "justify-start",
                  "mx-auto flex w-full max-w-3xl flex-col gap-2 px-6",
                )}
              >
                {message.role === "user" ? (
                  <div className="flex flex-col items-end w-full gap-1">
                    {/* Map over message.parts for user messages */}
                    {message.parts &&
                      message.parts.map((part, index) => {
                        if (part.type === "text") {
                          return (
                            <MessageContent
                              id={message.id}
                              key={index}
                              className="bg-muted/50  max-w-[85%] sm:max-w-[75%] px-3 py-1.5 rounded-xl"
                            >
                              {part.text}
                            </MessageContent>
                          );
                        }
                        return null;
                      })}
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-start gap-2">
                    {/* Map over message.parts for ai messages */}
                    {message.parts &&
                      message.parts.map((part, index) => {
                        if (part.type === "text") {
                          return (
                            <Markdown
                              className="prose dark:prose-invert bg-transparent"
                              id={message.id}
                              key={index}
                              components={markdownComponents}
                            >
                              {part.text}
                            </Markdown>
                          );
                        }

                        return null;
                      })}

                    <AIMessageFooter
                      status={status}
                      reload={reload}
                      message={message}
                      isStreaming={isCurrentlyStreaming}
                    />
                  </div>
                )}
              </MessageComponent>
            );
          })}

          <div className=" mx-auto flex w-full max-w-3xl flex-col gap-2 px-6">
            {error && <AIErrorMessage error={error} reload={reload} />}

            {status === "submitted" && (
              <AILoading status={status} messages={messages} />
            )}
          </div>
        </ChatContainerContent>
      </ChatContainerRoot>
    </div>
  );
}
