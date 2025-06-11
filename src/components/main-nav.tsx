"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";

export function MainNav() {
  const { isSignedIn, user } = useUser();
  const pathname = usePathname();
  return (
    <div className="flex justify-between items-center mt-2 md:mt-0">
      <div className="md:fixed z-20 flex justify-between items-center top-0 px-6 py-3 w-full bg-background/50 backdrop-filter backdrop-blur-sm bg-opacity-30">
        <Link className="font-medium font-mono text-sm" href={"/"}>
          next-t3.chat
        </Link>

        <div className="flex items-center gap-5">
          <Link href="/history">History</Link>
          <Link href="/settings/account">Settings</Link>
          {isSignedIn ? (
            <div className="flex items-center gap-5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="rounded-md cursor-pointer">
                    <AvatarImage src={user.imageUrl} alt={user.fullName!} />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>{user.fullName}</DropdownMenuLabel>
                  <p className="text-sm px-2 pb-1 text-muted-foreground">
                    {user.emailAddresses[0].emailAddress}
                  </p>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      Profile
                      <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                    </DropdownMenuItem>

                    <DropdownMenuItem>
                      Settings
                      <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem>GitHub</DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <SignOutButton>Log out</SignOutButton>

                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              {!pathname.startsWith("/auth") && (
                <Button asChild variant={"secondary"} size="sm">
                  <Link href={"/auth"}>Login</Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
