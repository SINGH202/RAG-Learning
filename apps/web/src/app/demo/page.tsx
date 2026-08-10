import type { Metadata } from "next";
import { DemoPageClient } from "@/components/DemoPageClient";

export const metadata: Metadata = {
  title: "Try DocuMind demo",
  description:
    "Live PDF Q&A with streaming answers and source citations. Upload documents and ask grounded questions.",
  openGraph: {
    title: "Try DocuMind demo",
    description:
      "Live PDF Q&A with streaming answers and source citations.",
    url: "/demo",
  },
};

export default function DemoPage() {
  return <DemoPageClient />;
}
