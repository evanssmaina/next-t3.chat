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

import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="flex flex-row items-center w-full mb-5 p-4">
        <Link className="w-full text-center" href="/">
          <span className="text-base font-semibold">Next-T3.chat</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-4">
        <Button variant={"outline"} size={"lg"} className="w-full space-x-4">
          New Chat
        </Button>
        <ThemeToggle />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
