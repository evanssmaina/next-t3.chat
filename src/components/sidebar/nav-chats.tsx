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
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";

export function NavChats() {
  const trpc = useTRPC();
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const isActive = (id: string) => pathname === `/chat/${id}`;
  const {
    data: chats,
    isLoading,
    error,
    refetch,
  } = useQuery(trpc.chat.get.queryOptions());

  if (!isSignedIn && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        <h3 className="text-center">Please sign in to view chats</h3>
      </div>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Recents</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-2 gap-0">
          {isLoading && (
            <>
              {Array.from({ length: 20 }).map((_, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuSkeleton />
                </SidebarMenuItem>
              ))}
            </>
          )}
          {!error && chats?.length === 0 && (
            <div className="text-center">
              No chats found. Start a new chat to get started.
            </div>
          )}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center gap-2">
              <h3 className="text-destructive text-center">
                Error loading chats
              </h3>
              <Button variant={"outline"} size={"sm"} onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}
          {!error &&
            chats?.map((item) => (
              <SidebarMenuItem key={item.id}>
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
