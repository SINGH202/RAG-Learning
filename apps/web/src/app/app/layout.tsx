import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!process.env.CLERK_SECRET_KEY?.trim()) {
    redirect("/sign-in");
  }

  await auth.protect();
  return children;
}
