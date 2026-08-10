import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { WakeDemoLink } from "@/components/WakeDemoLink";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { RecruiterContactForm } from "@/components/RecruiterContactForm";
import {
  BUILDER_GITHUB,
  BUILDER_LINKEDIN,
  BUILDER_NAME,
  CONTACT_EMAIL,
  CONTACT_PHONE_E164,
  getSiteUrl,
} from "@/lib/site";

const tech = [
  "LangChain",
  "ChromaDB",
  "Sentence Transformers",
  "Google Gemini",
  "FastAPI",
  "Next.js",
];

const faqs = [
  {
    q: "What is DocuMind?",
    a: "A portfolio PDF Q&A demo built on a manual RAG pipeline — retrieve relevant chunks, ground Gemini on that context, and show citations. It started as a CLI learning project and now runs as a hosted API plus Next.js UI.",
  },
  {
    q: "What happens to my uploaded PDFs and chat history?",
    a: "Demo chat history stays in your browser for about 7 days. The server-side index expires after roughly 30 minutes idle. If Backblaze B2 is configured, PDFs can be restored for the same session within that TTL after a restart.",
  },
  {
    q: "What if the shared Gemini quota is exhausted?",
    a: "The demo supports a bring-your-own Gemini API key so you can keep asking questions when the shared limit is hit.",
  },
  {
    q: "What stack powers this?",
    a: "LangChain, Sentence Transformers / embeddings, ChromaDB, Google Gemini, FastAPI, and Next.js — with a shared rag-core package used by both the CLI and the API.",
  },
  {
    q: "How can I get in touch about hiring or the project?",
    a: "Email apk.anurag.singh@gmail.com, call 88749 40467, use the contact form below, or open a GitHub issue. I usually reply within 2 business days.",
  },
] as const;

export const metadata: Metadata = {
  title: "DocuMind — PDF Q&A with RAG",
  description:
    "Upload PDFs and ask grounded questions with citations. Portfolio RAG demo built with LangChain, ChromaDB, Gemini, FastAPI, and Next.js.",
  openGraph: {
    title: "DocuMind — PDF Q&A with RAG",
    description:
      "Upload PDFs and ask grounded questions with citations. Built from scratch as a learning-to-production RAG project.",
    url: "/",
  },
};

export default function HomePage() {
  const siteUrl = getSiteUrl();
  const sameAs = [BUILDER_GITHUB, BUILDER_LINKEDIN].filter(Boolean);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "DocuMind",
        url: siteUrl,
        description:
          "Upload PDFs and ask grounded questions with citations using a manual RAG pipeline.",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        author: { "@id": `${siteUrl}/#person` },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "Person",
        "@id": `${siteUrl}/#person`,
        name: BUILDER_NAME,
        email: CONTACT_EMAIL,
        telephone: CONTACT_PHONE_E164,
        url: BUILDER_GITHUB,
        sameAs,
      },
    ],
  };

  return (
    <main className="relative overflow-hidden pb-24 md:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(ellipse_at_top,_rgba(15,118,110,0.18),_transparent_55%)]" />

      <SiteHeader showDemoCta />

      <section className="relative mx-auto grid w-full max-w-6xl gap-10 px-6 pb-20 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:pt-16">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal">
            DocuMind
          </p>
          <h1 className="mt-4 max-w-xl font-display text-5xl leading-[1.05] text-ink md:text-6xl">
            Ask your PDFs.
            <span className="block text-teal">Get cited answers.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/70">
            DocuMind turns PDFs into a temporary RAG session. Upload one or more
            documents, ask questions, and see the source chunks behind every
            answer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <WakeDemoLink className="rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal/90">
              Open live demo
            </WakeDemoLink>
            <a
              href="#case-study"
              className="rounded-full border border-ink/15 bg-white/50 px-6 py-3 text-sm font-medium text-ink transition hover:bg-white"
            >
              See the build story
            </a>
          </div>
        </div>

        <div className="rounded-[2rem] border border-ink/10 bg-white/65 p-6 shadow-[0_30px_80px_rgba(28,25,23,0.08)] backdrop-blur">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink/45">
            Recruiter flow
          </p>
          <ol className="mt-4 space-y-4">
            {[
              "Upload one or more PDFs (max 10 MB each)",
              "Ask a natural-language question",
              "Read the answer with source citations",
              "Bring your own Gemini key if the demo limit hits",
            ].map((step, index) => (
              <li key={step} className="flex gap-3 text-sm text-ink/80">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sand font-medium text-ink">
                  {index + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="case-study"
        className="relative scroll-mt-24 border-t border-ink/10 bg-white/40"
      >
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="font-display text-3xl text-ink">Case study</h2>
          <p className="mt-3 max-w-2xl text-ink/65">
            Built to learn RAG internals end-to-end, then ship a recruiter-ready
            demo — without treating RetrievalQA as a black box.
          </p>
          <ol className="mt-8 max-w-2xl space-y-5">
            {[
              {
                title: "Problem",
                body: "Understand every layer of RAG — load, chunk, embed, retrieve, prompt, generate — instead of wrapping a single library call.",
              },
              {
                title: "Build",
                body: "Modular CLI first, then shared rag-core, FastAPI sessions with streaming citations, and a Next.js UI with demo history.",
              },
              {
                title: "Result",
                body: "A live demo at trydocumind.vercel.app: upload PDFs, ask questions, and inspect the chunks behind each answer.",
              },
            ].map((item, index) => (
              <li key={item.title} className="flex gap-4 text-sm text-ink/80">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sand font-medium text-ink">
                  {index + 1}
                </span>
                <div className="pt-0.5">
                  <p className="font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 leading-relaxed text-ink/65">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="relative border-t border-ink/10">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="font-display text-3xl text-ink">Built to show the stack</h2>
          <p className="mt-3 max-w-2xl text-ink/65">
            Manual RAG pipeline — no RetrievalQA black box. Shared{" "}
            <code className="rounded bg-sand px-1.5 py-0.5 font-mono text-sm">
              rag-core
            </code>{" "}
            powers both the CLI and the hosted API.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {tech.map((item) => (
              <span
                key={item}
                className="rounded-full border border-ink/10 bg-paper px-3 py-1.5 text-sm text-ink/80"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="relative scroll-mt-24 border-t border-ink/10 bg-white/40"
      >
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="font-display text-3xl text-ink">
            Frequently asked questions
          </h2>
          <p className="mt-3 max-w-2xl text-ink/65">
            Straight answers about the demo, data, and stack.
          </p>
          <dl className="mt-8 max-w-3xl space-y-6">
            {faqs.map((item) => (
              <div key={item.q}>
                <dt className="font-semibold text-ink">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink/65">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section
        id="about"
        className="relative scroll-mt-24 border-t border-ink/10 bg-white/40"
      >
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="font-display text-3xl text-ink">About the builder</h2>
          <p className="mt-3 max-w-2xl text-ink/65">
            I&apos;m {BUILDER_NAME}. DocuMind is a portfolio project I built to
            learn RAG end-to-end and ship a recruiter-ready demo — from a
            modular CLI through a shared core, FastAPI, and Next.js.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <a
              href={BUILDER_GITHUB}
              target="_blank"
              rel="noreferrer"
              className="text-teal underline-offset-2 hover:underline"
            >
              GitHub
            </a>
            {BUILDER_LINKEDIN ? (
              <a
                href={BUILDER_LINKEDIN}
                target="_blank"
                rel="noreferrer"
                className="text-teal underline-offset-2 hover:underline"
              >
                LinkedIn
              </a>
            ) : null}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-teal underline-offset-2 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            <a href="#contact" className="text-ink/70 hover:text-ink">
              Contact form
            </a>
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="relative scroll-mt-24 border-t border-ink/10"
      >
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="font-display text-3xl text-ink">Contact</h2>
          <p className="mt-3 max-w-2xl text-ink/65">
            Interested in hiring or chatting about this project? Send a short
            note — I usually reply within 2 business days.
          </p>
          <div className="mt-2 max-w-xl">
            <RecruiterContactForm />
          </div>
        </div>
      </section>

      <footer className="border-t border-ink/10 px-6 py-10 text-sm text-ink/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <a href="#case-study" className="hover:text-ink">
              Case study
            </a>
            <a href="#faq" className="hover:text-ink">
              FAQ
            </a>
            <a href="#about" className="hover:text-ink">
              About
            </a>
            <a href="#contact" className="hover:text-ink">
              Contact
            </a>
            <a href="/demo" className="hover:text-ink">
              Demo
            </a>
            <a href="/privacy" className="hover:text-ink">
              Privacy
            </a>
            <a
              href="https://github.com/SINGH202/RAG-Learning"
              className="text-teal underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
          <p>MIT License · SINGH202/RAG-Learning</p>
        </div>
      </footer>

      <StickyMobileCta />
    </main>
  );
}
