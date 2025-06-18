import { ChatProvider } from "@/components/chat/chat-provider";
import { SideBarProvider } from "@/components/sidebar/sidebar-provider";

export default function ChatLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <SideBarProvider>{children}</SideBarProvider>
    </ChatProvider>
  );
}
