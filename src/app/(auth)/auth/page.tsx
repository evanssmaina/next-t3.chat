import { Suspense } from "react";
import { SignInButtons } from "./sign-in-buttons";

export default function AuthPage() {
  return (
    <div className="text-center flex flex-col items-center">
      <h1 className="mb-5 h-5 text-xl font-bold text-foreground">
        Welcome Next T3 Chat
      </h1>
      <p className="mb-10">
        Sign in below (we'll increase your message limits if you do 😉)
      </p>

      <div className="max-w-sm w-full mb-10">
        <Suspense>
          <SignInButtons />
        </Suspense>
      </div>
      <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
    </div>
  );
}
