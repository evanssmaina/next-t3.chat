"use client";

import { Chat } from "@/components/chat/chat";
import { useParams } from "next/navigation";

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  return <Chat id={chatId} />;
}
