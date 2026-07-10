import Link from "next/link";

const tech = [
  "LangChain",
  "ChromaDB",
  "Sentence Transformers",
  "Google Gemini",
  "FastAPI",
  "Next.js",
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(ellipse_at_top,_rgba(15,118,110,0.18),_transparent_55%)]" />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-6">
        <p className="font-display text-2xl tracking-tight text-ink">DocuMind</p>
        <nav className="flex shrink-0 items-center gap-4 text-sm">
          <a
            href="https://github.com/SINGH202/RAG-Learning"
            target="_blank"
            rel="noreferrer"
            className="text-ink/70 transition hover:text-ink"
          >
            GitHub
          </a>
          <Link
            href="/demo"
            className="rounded-full bg-ink px-4 py-2 font-medium text-paper transition hover:bg-ink/90"
          >
            Try demo
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto grid w-full max-w-6xl gap-10 px-6 pb-20 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:pt-16">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal">
            RAG portfolio project
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
            <Link
              href="/demo"
              className="rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal/90"
            >
              Open live demo
            </Link>
            <a
              href="https://documind-api-e32e.onrender.com/api/v1/health"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-ink/15 bg-white/50 px-6 py-3 text-sm font-medium text-ink transition hover:bg-white"
            >
              API health
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

      <section className="relative border-t border-ink/10 bg-white/40">
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

      <footer className="border-t border-ink/10 px-6 py-8 text-center text-sm text-ink/50">
        MIT License ·{" "}
        <a
          href="https://github.com/SINGH202/RAG-Learning"
          className="text-teal underline-offset-2 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          SINGH202/RAG-Learning
        </a>
      </footer>
    </main>
  );
}
