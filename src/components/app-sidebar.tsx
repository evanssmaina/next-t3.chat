"use client";

import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import Link from "next/link";
import type * as React from "react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="p-2" collapsible="offcanvas" {...props}>
      <SidebarHeader className="flex flex-row items-center w-full">
        <Link className="w-full text-center" href="/">
          <span className="text-base font-semibold">Next-T3.chat</span>
        </Link>
      </SidebarHeader>
      <SidebarContent></SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
