import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/recents(.*)", "/settings(.*)"]);

export default clerkMiddleware(
  async (auth, req) => {
    if (isProtectedRoute(req)) await auth.protect();
  },
  {
    contentSecurityPolicy: {},
  },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
