"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { useTRPC } from "@/trpc/client";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "../ui/button";

type NavMainProps = {
  isActive: (item: any) => boolean;
};

export function NavChats({ isActive }: NavMainProps) {
  const trpc = useTRPC();
  const { isSignedIn } = useAuth();
  const {
    data: chats,
    isLoading,
    error,
    refetch,
  } = useQuery(trpc.chat.get.queryOptions());

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        <h3 className="text-center">Please sign in to view chats</h3>
      </div>
    );
  }

  if (isLoading) {
    return (
      <SidebarMenu>
        {Array.from({ length: 20 }).map((_, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuSkeleton />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        <h3 className="text-destructive text-center">Error loading chats</h3>
        <Button variant={"outline"} size={"sm"} onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!chats || chats.length === 0) {
    return <div>No chats found</div>;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Recents</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-2 gap-0">
          {chats?.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton isActive={isActive(item.id)} asChild>
                <Link href={`/chat/${item.id}`} prefetch={true}>
                  <span className="truncate">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
