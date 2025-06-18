import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { SignOutButton, useUser } from "@clerk/nextjs";
import {
  ChevronsUpDownIcon,
  LogOutIcon,
  MessageCircle,
  Settings2Icon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import { Skeleton } from "../ui/skeleton";

export function NavFooter() {
  const { user, isLoaded, isSignedIn } = useUser();
  const isMobile = useIsMobile();

  if (!isLoaded) {
    return (
      <SidebarFooter className="flex items-center justify-center gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Skeleton className="w-8 h-8 rounded-md" />
              <div className="flex flex-col gap-1">
                <Skeleton className="w-20 h-4 rounded-md" />
                <Skeleton className="w-16 h-3 rounded-md" />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    );
  }

  if (!isSignedIn && isLoaded) {
    return (
      <SidebarFooter className="flex items-center justify-center gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <Button size="lg" className="w-full">
              <Link href="/auth">Login</Link>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    );
  }

  return (
    <SidebarFooter className="flex items-center justify-center gap-2">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg grayscale">
                  <AvatarImage src={user?.imageUrl} alt={user?.fullName!} />
                  <AvatarFallback className="rounded-lg">
                    {user?.fullName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.fullName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user?.emailAddresses[0].emailAddress}
                  </span>
                </div>
                <ChevronsUpDownIcon className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel>{user?.fullName}</DropdownMenuLabel>
              <p className="text-sm px-2 pb-1 text-muted-foreground">
                {user?.emailAddresses[0].emailAddress}
              </p>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="https://nt3chat.userjot.com/" target="_blank">
                  <MessageCircle />
                  Feedback
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/profile">
                  <Settings2Icon />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <SignOutButton>
                  <div>
                    <LogOutIcon />
                    Log out
                  </div>
                </SignOutButton>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
