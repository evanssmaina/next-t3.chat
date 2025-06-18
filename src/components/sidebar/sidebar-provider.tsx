"use client";

import { SidebarProvider } from "../ui/sidebar";
import { AppSidebar } from "./app-sidebar";

export function SideBarProvider({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex-1">{children}</div>
    </SidebarProvider>
  );
}
