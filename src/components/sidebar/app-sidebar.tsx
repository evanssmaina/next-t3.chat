"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useUser } from "@clerk/nextjs";
import { MessageCircle, MessageSquareIcon, PlusCircleIcon } from "lucide-react";
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

  const isActive = (item: any) => {
    if (item.segment === null) {
      return pathname === "/";
    }

    return segment === item.segment;
  };

  return (
    <Sidebar side="left" variant="sidebar">
      <SidebarHeader>
        <div className="flex items-center justify-between p-2">
          <Link className="font-medium font-mono text-lg" href={"/"}>
            nt3
          </Link>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain isActive={isActive} items={navItems} />
        <NavChats isActive={isActive} />
      </SidebarContent>
      <NavFooter />
    </Sidebar>
  );
}
