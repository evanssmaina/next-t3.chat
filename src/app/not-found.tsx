import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="w-full max-w-3xl mx-auto mt-20 h-full flex">
      <div className="flex flex-col gap-3 w-full justify-center text-center">
        <p className="text-9xl font-mono">404</p>
        <h2>Page Not Found</h2>

        <Button asChild className="w-fit mx-auto mt-5">
          <Link href="/">
            <Icons.plus /> Start new chat
          </Link>
        </Button>
      </div>
    </div>
  );
}
