import { AppSidebar } from "@/components/app-sidebar";
import { ChatInput } from "@/components/chat/chat-input";
import { Greeting } from "@/components/home/greeting";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="max-w-3xl w-full mx-auto pt-20 pb-5 flex flex-col justify-between h-full">
              <Greeting />
              <ChatInput />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
