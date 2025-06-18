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
import { useParams } from "next/navigation";
import { useCallback, useContext, useMemo, useRef, useState } from "react";
import { createContext } from "react";
import { toast } from "sonner";

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
  setSelectedModel: (value: string | ((val: string) => string)) => void;

  // Attachments
  attachments: Attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;

  // Starting chat
  isStartingChat: boolean;
  setIsStartingChat: React.Dispatch<React.SetStateAction<boolean>>;

  // Data
  data: JSONValue[] | undefined;

  // Initial Messages
  setInitialMessages: React.Dispatch<
    React.SetStateAction<Message[] | undefined>
  >;

  // Chat Id
  chatId: string | undefined;

  //
  startNewChat: () => void;
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

  // Starting chat
  const [isStartingChat, setIsStartingChat] = useState(false);

  // Initial Messages
  const [initialMessages, setInitialMessages] = useState<Message[] | undefined>(
    undefined,
  );

  // Chat Id

  const [chatId, setChatId] = useState<string | undefined>(undefined);

  const chatOptions: UseChatOptions = useMemo(
    () => ({
      initialMessages,
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
        };
        return requestBody;
      },
      onError: (error) => {
        console.log(error.message);
        toast.error("An error occured, please try again later");
      },
    }),
    [selectedModel],
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
    setIsStartingChat(false);
    router.push("/");
  }, [router, setIsStartingChat]);

  const value = {
    // Model
    selectedModel,
    setSelectedModel,

    // Attachments
    attachments,
    setAttachments,

    // Starting chat
    isStartingChat,
    setIsStartingChat,

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
