import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "./ui/button";

export function MainNav() {
  return (
    <nav className="flex flex-row justify-between p-4">
      <Link href={"/"} className="font-mono hover:underline decoration-dashed">
        next-t3.chat
      </Link>

      <div className="flex justify-end items-center  gap-4 ">
        <SignedOut>
          <Button>
            <SignUpButton />
          </Button>
          <Button variant={"outline"}>
            <SignInButton />
          </Button>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  );
}
