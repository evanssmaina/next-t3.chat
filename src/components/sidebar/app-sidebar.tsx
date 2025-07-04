"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { MessageSquareIcon, PlusCircleIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { NavChats } from "./nav-chats";
import { NavFooter } from "./nav-footer";
import { NavMain } from "./nav-main";

export function AppSidebar() {
  const navItems = [
    {
      title: "New Chat",
      url: "/",
      segment: "",
      icon: PlusCircleIcon,
    },
    {
      title: "Chats",
      url: "/recents",
      segment: "recents",
      icon: MessageSquareIcon,
    },
  ];

  const segment = useSelectedLayoutSegment();
  const pathname = usePathname();
  const { open } = useSidebar();
  const isActive = (item: any) => {
    if (item.segment === null) {
      return pathname === "/";
    }

    return segment === item.segment;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div
          className={cn(
            "flex items-center justify-between py-1",
            open && "p-2",
          )}
        >
          {open && (
            <Link className="font-medium font-mono text-lg" href={"/"}>
              nt3
            </Link>
          )}
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent className="mt-2">
        <NavMain isActive={isActive} items={navItems} />
        {open && <NavChats />}
      </SidebarContent>
      <NavFooter />
    </Sidebar>
  );
}
