"use client";

import { usePathname } from "next/navigation";
import { WakeDemoLink } from "@/components/WakeDemoLink";

const HIDDEN_PREFIXES = ["/demo", "/thank-you"];

export function StickyMobileCta() {
  const pathname = usePathname();
  const hidden = HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (hidden) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/95 p-3 backdrop-blur md:hidden">
      <WakeDemoLink className="flex w-full items-center justify-center rounded-full bg-teal px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal/90">
        Try the live demo
      </WakeDemoLink>
    </div>
  );
}
