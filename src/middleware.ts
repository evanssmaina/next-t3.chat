import { logger } from "@/lib/axiom/server";
import { transformMiddlewareRequest } from "@axiomhq/nextjs";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/recents(.*)", "/settings(.*)"]);

export default clerkMiddleware(
  async (auth, req, event) => {
    if (isProtectedRoute(req)) await auth.protect();

    logger.info(...transformMiddlewareRequest(req));

    event.waitUntil(logger.flush());
    return NextResponse.next();
  },
  {
    contentSecurityPolicy: {},
  },
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
