import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { WakeDemoLink } from "@/components/WakeDemoLink";

export const metadata: Metadata = {
  title: "Privacy — DocuMind",
  description:
    "How DocuMind handles demo uploads, chat history, and analytics for this portfolio PDF Q&A project.",
  openGraph: {
    title: "Privacy — DocuMind",
    description:
      "How DocuMind handles demo uploads, chat history, and analytics.",
    url: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className="relative min-h-dvh pb-24 md:pb-0">
      <SiteHeader showDemoCta />

      <div className="mx-auto w-full max-w-3xl px-6 pb-16 pt-4">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Privacy" }]}
        />

        <h1 className="mt-6 font-display text-4xl text-ink">Privacy</h1>
        <p className="mt-3 text-ink/65">
          DocuMind is a portfolio demo. This page describes how the live demo
          handles data today — short and accurate, not legal boilerplate for a
          SaaS product.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink/75">
          <section>
            <h2 className="font-display text-2xl text-ink">Uploads and sessions</h2>
            <p className="mt-2">
              When you use the demo, PDFs are sent to the hosted API to build a
              temporary retrieval index. Server-side session data expires after
              roughly 30 minutes of idle time. If object storage (Backblaze B2)
              is configured, files may be restored for the same session within
              that window after a restart.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Chat history</h2>
            <p className="mt-2">
              Demo chat history is stored in your browser (local storage) for
              about 7 days so you can resume a conversation on the same device.
              Clearing site data removes it.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">API keys</h2>
            <p className="mt-2">
              If you choose “bring your own Gemini key,” that key is used for
              your requests as implemented by the demo UI/API. Prefer a
              restricted key and rotate it if you shared it unintentionally.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Analytics and cookies</h2>
            <p className="mt-2">
              This site uses{" "}
              <a
                href="https://umami.is"
                target="_blank"
                rel="noreferrer"
                className="text-teal underline-offset-2 hover:underline"
              >
                Umami
              </a>{" "}
              (privacy-focused analytics) for page views and basic usage
              signals — no advertising cookies and no Google Analytics. Vercel
              Speed Insights may collect performance metrics on the deployed
              frontend. Signed-in project features use Clerk for authentication,
              which sets its own cookies per Clerk’s policies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Contact</h2>
            <p className="mt-2">
              Questions about this project or privacy here: use the{" "}
              <Link href="/#contact" className="text-teal underline-offset-2 hover:underline">
                contact form
              </Link>{" "}
              or open an issue on{" "}
              <a
                href="https://github.com/SINGH202/RAG-Learning"
                className="text-teal underline-offset-2 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full border border-ink/15 bg-white/50 px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-white"
          >
            Back home
          </Link>
          <WakeDemoLink className="rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal/90">
            Open live demo
          </WakeDemoLink>
        </div>
      </div>

      <StickyMobileCta />
    </main>
  );
}
