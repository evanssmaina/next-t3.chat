"use client";

import { generateId } from "@/utils/generate-id";
import { useChat as useAIChat } from "@ai-sdk/react";
import {
  type ChatRequestOptions,
  type Message,
  type UIMessage,
  createIdGenerator,
} from "ai";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { parseAsString } from "nuqs";
import {
  type ReactNode,
  type SetStateAction,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

interface ChatProviderTypes {
  status: "submitted" | "streaming" | "ready" | "error";
  reload: (
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  stop: () => void;
  input: string;
  handleValueChange: (value: string) => void;
  messages: UIMessage[];
  error: Error | undefined;
  handleChatInterfaceKeyDown: (e: React.KeyboardEvent) => void;
  handleStartChateKeyDown: (e: React.KeyboardEvent) => void;
  handleStartChat: (
    e?:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
  handleChatInterfaceSend: (
    e?:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[]),
  ) => void;
  setActiveChat: React.Dispatch<SetStateAction<string | undefined>>;
  handleNewChat: () => void;
  activeChat: string | undefined;
}

const ChatContext = createContext<ChatProviderTypes | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [activeChat, setActiveChat] = useQueryState("chat", parseAsString);

  const {
    messages,
    input,
    handleSubmit,
    stop,
    status,
    setInput,
    reload,
    error,
    setMessages,
  } = useAIChat({
    id: activeChat ?? undefined,
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

  const router = useRouter();

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

      handleSubmit();
    },
    [handleSubmit, input, router, generateId, status],
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

  const handleNewChat = useCallback(() => {
    setActiveChat(undefined);
    setMessages([]);

    router.push("/");
  }, [router, setMessages]);

  const context: ChatProviderTypes = {
    messages,
    input,
    status,
    stop,
    reload,
    error,
    handleValueChange,
    handleChatInterfaceKeyDown,
    handleStartChateKeyDown,
    setActiveChat,
    handleStartChat,
    handleChatInterfaceSend,
    handleNewChat,
    setMessages,
    activeChat,
  };

  return (
    <ChatContext.Provider value={context}>{children}</ChatContext.Provider>
  );
}

export function useChat(): ChatProviderTypes {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
