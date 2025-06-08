"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth, useUser } from "@clerk/nextjs";
import { LogInIcon } from "lucide-react";
import Link from "next/link";

export function NavUser() {
  const { userId } = useAuth();
  const { user } = useUser();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {userId ? (
          <SidebarMenuButton size={"lg"}>
            {user?.emailAddresses[0].emailAddress}
          </SidebarMenuButton>
        ) : (
          <SidebarMenuButton size={"lg"} asChild>
            <Link href="/auth" className="flex items-center gap-4">
              <LogInIcon className="size-4" />
              <span> Log In</span>
            </Link>
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
