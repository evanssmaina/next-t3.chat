"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-up";

export function SignInButtons() {
  return (
    <SignIn.Root>
      <Clerk.Loading>
        {(isGlobalLoading) => (
          <div className="flex flex-col gap-5">
            <Clerk.Connection name="google" asChild>
              <Button
                size="lg"
                className="w-full gap-4"
                type="button"
                disabled={isGlobalLoading}
              >
                <Clerk.Loading scope="provider:google">
                  {(isLoading) =>
                    isLoading ? (
                      <Icons.loader className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Icons.google />
                        Continue with Google
                      </>
                    )
                  }
                </Clerk.Loading>
              </Button>
            </Clerk.Connection>
            <Clerk.Connection name="github" asChild>
              <Button
                size="lg"
                className="w-full gap-4"
                type="button"
                disabled={isGlobalLoading}
              >
                <Clerk.Loading scope="provider:github">
                  {(isLoading) =>
                    isLoading ? (
                      <Icons.loader className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Icons.github />
                        Continue with GitHub
                      </>
                    )
                  }
                </Clerk.Loading>
              </Button>
            </Clerk.Connection>
          </div>
        )}
      </Clerk.Loading>
    </SignIn.Root>
  );
}
