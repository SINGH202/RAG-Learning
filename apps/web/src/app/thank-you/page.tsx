import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { WakeDemoLink } from "@/components/WakeDemoLink";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_E164,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Thanks — DocuMind",
  description:
    "Thanks for reaching out about DocuMind. Expect a reply within about two business days.",
  openGraph: {
    title: "Thanks — DocuMind",
    description: "Thanks for your inquiry about DocuMind.",
    url: "/thank-you",
  },
};

export default function ThankYouPage() {
  return (
    <main className="relative min-h-dvh">
      <SiteHeader showDemoCta />

      <div className="mx-auto w-full max-w-3xl px-6 pb-16 pt-4">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Thank you" }]}
        />

        <h1 className="mt-6 font-display text-4xl text-ink">Thank you</h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink/70">
          Your mail client should have opened with the inquiry. If it did not,
          email{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-teal underline-offset-2 hover:underline"
          >
            {CONTACT_EMAIL}
          </a>{" "}
          or call{" "}
          <a
            href={`tel:${CONTACT_PHONE_E164}`}
            className="text-teal underline-offset-2 hover:underline"
          >
            {CONTACT_PHONE_DISPLAY}
          </a>
          . I usually reply within 2 business days.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <WakeDemoLink className="rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal/90">
            Try the live demo
          </WakeDemoLink>
          <Link
            href="/"
            className="rounded-full border border-ink/15 bg-white/50 px-6 py-3 text-sm font-medium text-ink transition hover:bg-white"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
