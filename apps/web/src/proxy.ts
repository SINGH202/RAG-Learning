import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/app(.*)"]);

/**
 * Always use clerkMiddleware — Clerk's auth()/currentUser() require it
 * (proxy or middleware). Protect only /app when keys are present.
 */
export default clerkMiddleware(async (auth, req) => {
  if (!process.env.CLERK_SECRET_KEY?.trim()) {
    return;
  }
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
