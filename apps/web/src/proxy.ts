import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

function isAppRoute(pathname: string) {
  return pathname === "/app" || pathname.startsWith("/app/");
}

/**
 * clerkMiddleware() throws "Missing secretKey" if CLERK_SECRET_KEY is absent.
 * Check the secret at request time (not module load) so Vercel runtime env is used.
 *
 * When the secret is missing, do NOT bounce /app → /sign-in → /app forever.
 * Send users to a clear "auth unconfigured" state instead.
 *
 * Route protection with a configured secret lives in `app/app/layout.tsx`
 * via auth.protect().
 */
export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!process.env.CLERK_SECRET_KEY?.trim()) {
    if (isAppRoute(request.nextUrl.pathname)) {
      const signIn = new URL("/sign-in", request.url);
      signIn.searchParams.set("error", "auth_unconfigured");
      return NextResponse.redirect(signIn);
    }
    return NextResponse.next();
  }

  return clerkMiddleware()(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
