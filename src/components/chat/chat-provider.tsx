"use client";

import { availableModels } from "@/ai/providers";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { type UseChatOptions, useChat as useAIChat } from "@ai-sdk/react";
import {
  type Attachment,
  type ChatRequestOptions,
  type JSONValue,
  type Message,
  type UIMessage,
  createIdGenerator,
} from "ai";
import { useRouter } from "next/navigation";
import { useCallback, useContext, useMemo, useRef, useState } from "react";
import { createContext } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

type ChatProviderProps = {
  // Messages
  messages: UIMessage[];

  // Status
  status: "submitted" | "streaming" | "ready" | "error";
  stop: () => void;
  reload: (
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  error: Error | undefined;

  // Input
  input: string;
  handleValueChange: (value: string) => void;

  // Submit
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions,
  ) => void;

  // Resume
  experimental_resume: () => void;

  // Model
  selectedModel: string;
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
  // Attachments
  attachments: Attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;

  // New chat
  isNewChat: boolean;
  setIsNewChat: React.Dispatch<React.SetStateAction<boolean>>;

  // Data
  data: JSONValue[] | undefined;

  // Initial Messages
  setInitialMessages: React.Dispatch<
    React.SetStateAction<Message[] | undefined>
  >;

  // Chat Id
  chatId: string;
  setChatId: React.Dispatch<React.SetStateAction<string>>;

  //
  startNewChat: () => void;
  handleStartChat: (
    e?:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => void;

  // Send message
  handleChatInterfaceSend: (
    e?:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
};

const ChatProviderContext = createContext<ChatProviderProps | undefined>(
  undefined,
);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Model
  const [selectedModel, setSelectedModel] = useLocalStorage(
    "next-t3-chat-selected-model",
    availableModels[0].id,
  );

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // New chat
  const [isNewChat, setIsNewChat] = useState(false);

  // Initial Messages
  const [initialMessages, setInitialMessages] = useState<Message[] | undefined>(
    undefined,
  );

  // Chat Id

  const [chatId, setChatId] = useState<string>("");

  const chatOptions: UseChatOptions = useMemo(
    () => ({
      id: chatId,
      initialMessages,
      sendExtraMessageFields: true,
      generateId: createIdGenerator({
        prefix: "msgc",
        separator: "_",
      }),
      experimental_prepareRequestBody: ({
        messages,
      }: { messages: UIMessage[] }) => {
        const requestBody = {
          message: messages[messages.length - 1],
          chatId,
          model: selectedModel,
        };
        return requestBody;
      },
      onError: (error) => {
        console.log(error.message);
        toast.error("An error occured, please try again later");
      },
    }),
    [selectedModel, chatId],
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
    experimental_resume,
    data,
  } = useAIChat(chatOptions);

  const handleValueChange = useCallback(
    (value: string) => setInput(value),
    [setInput],
  );

  const startNewChat = useCallback(() => {
    setIsNewChat(false);
    router.push("/");
  }, [router]);

  const handleStartChat = useCallback(
    (
      e?:
        | React.FormEvent<HTMLFormElement>
        | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    ) => {
      if (!input.trim() || status === "submitted") return;

      const newId = uuidv4();
      setChatId(newId);
      setIsNewChat(true);
      router.push(`/chat/${newId}`);

      handleSubmit(e, {
        experimental_attachments: attachments,
      });
    },
    [handleSubmit, input, status, router, attachments],
  );

  const handleChatInterfaceSend = useCallback(
    (
      e?:
        | React.FormEvent<HTMLFormElement>
        | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    ) => {
      if (!input.trim() || status === "submitted") return;

      handleSubmit(e, {
        experimental_attachments: attachments,
      });
    },
    [handleSubmit, input, status, attachments],
  );

  const value = {
    // Model
    selectedModel,
    setSelectedModel,

    // Attachments
    attachments,
    setAttachments,

    // New chat
    isNewChat,
    setIsNewChat,

    // Chat
    input,
    error,
    messages,
    reload,
    status,
    stop,
    setInput,

    // Submit
    handleSubmit,

    experimental_resume,
    data,
    handleValueChange,

    // Initial Messages
    setInitialMessages,

    // Chat Id
    chatId,
    setChatId,

    // Start new chat
    startNewChat,
    handleStartChat,

    // Send message
    handleChatInterfaceSend,
  };

  return (
    <ChatProviderContext.Provider value={value}>
      {children}
    </ChatProviderContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatProviderContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
