"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { pokeApiAwake } from "@/lib/api";

type WakeDemoLinkProps = {
  href?: string;
  className?: string;
  children: ReactNode;
};

/** Navigates to the demo and starts waking Render in parallel. */
export function WakeDemoLink({
  href = "/demo",
  className,
  children,
}: WakeDemoLinkProps) {
  return (
    <Link href={href} className={className} onClick={() => pokeApiAwake()}>
      {children}
    </Link>
  );
}
