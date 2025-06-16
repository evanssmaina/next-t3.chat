"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";

export function MainNav() {
  const { isSignedIn, user } = useUser();
  const pathname = usePathname();

  const navLinks = [
    { name: "Recent Chats", href: "/recents" },
    { name: "Settings", href: "/settings/profile" },
  ];
  return (
    <div className="flex justify-between items-center mt-2 md:mt-0">
      <div className="md:fixed z-20 flex justify-between items-center top-0 px-6 py-3 w-full bg-background ">
        <Link className="font-medium font-mono text-sm" href={"/"}>
          nt3
        </Link>

        <div className="flex items-center gap-5">
          {isSignedIn ? (
            <>
              {navLinks.map((link, index) => (
                <Link
                  key={index}
                  className={cn(
                    pathname.startsWith(link.href)
                      ? "text-white"
                      : "text-muted-foreground hover:text-white",
                    "duration-100 ease-in-out",
                  )}
                  href={link.href}
                >
                  {link.name}
                </Link>
              ))}
              <Button asChild size={"sm"} variant={"outline"}>
                <Link href="https://nt3.userjot.com/" target="_blank">
                  Feedback
                </Link>
              </Button>

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

                    <DropdownMenuItem>
                      <SignOutButton>Log out</SignOutButton>

                      <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
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
