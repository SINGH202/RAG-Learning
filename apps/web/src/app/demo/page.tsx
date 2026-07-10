import Link from "next/link";
import { DemoWorkspace } from "@/components/DemoWorkspace";

export default function DemoPage() {
  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="font-display text-2xl tracking-tight text-ink">
          DocuMind
        </Link>
        <div className="flex shrink-0 items-center gap-4 text-sm">
          <a
            href="https://github.com/SINGH202/RAG-Learning"
            target="_blank"
            rel="noreferrer"
            className="text-ink/70 transition hover:text-ink"
          >
            GitHub
          </a>
          <Link href="/" className="text-ink/70 transition hover:text-ink">
            Home
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-6 pb-4">
        <h1 className="font-display text-3xl text-ink md:text-4xl">Live demo</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-ink/65">
          First request after idle may take ~30–60s while Render wakes up.
          Upload PDFs, then ask with citations.
        </p>
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-8">
        <DemoWorkspace />
      </div>
    </main>
  );
}
