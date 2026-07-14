import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const hasClerkSecret = Boolean(process.env.CLERK_SECRET_KEY?.trim());

function isAppRoute(pathname: string) {
  return pathname === "/app" || pathname.startsWith("/app/");
}

/**
 * clerkMiddleware() throws "Missing secretKey" if CLERK_SECRET_KEY is absent.
 * On Vercel that takes down the entire site (500). Only wrap with Clerk when
 * the secret is configured; otherwise keep guest pages working.
 *
 * Route protection lives in `app/app/layout.tsx` via auth.protect() (resource-based),
 * not createRouteMatcher (deprecated).
 */
function guestProxy(request: NextRequest) {
  if (isAppRoute(request.nextUrl.pathname)) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("redirect_url", request.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
}

export default hasClerkSecret ? clerkMiddleware() : guestProxy;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
