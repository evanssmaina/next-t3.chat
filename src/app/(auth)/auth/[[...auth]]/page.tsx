import { Suspense } from "react";
import { SignInButtons } from "../sign-in-buttons";

export default function AuthPage() {
  return (
    <div className="text-center flex flex-col items-center max-w-sm w-full">
      <h1 className="mb-10 h-5 text-xl font-bold text-foreground">
        Welcome to nt3
      </h1>

      <div className="w-full mb-10">
        <Suspense>
          <SignInButtons />
        </Suspense>
      </div>
    </div>
  );
}
