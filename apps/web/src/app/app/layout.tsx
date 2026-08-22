import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!process.env.CLERK_SECRET_KEY?.trim()) {
    // Avoid /app ↔ /sign-in loops when server auth is not configured.
    redirect("/sign-in?error=auth_unconfigured");
  }

  await auth.protect();
  return children;
}
