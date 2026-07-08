import Link from "next/link";
import { DemoWorkspace } from "@/components/DemoWorkspace";

export default function DemoPage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-2xl tracking-tight text-ink">
          DocuMind
        </Link>
        <div className="flex items-center gap-4 text-sm">
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

      <div className="mx-auto max-w-6xl px-6 pb-6">
        <h1 className="font-display text-4xl text-ink">Live demo</h1>
        <p className="mt-2 max-w-2xl text-ink/65">
          First request after idle may take ~30–60s while the Render free tier
          wakes up. After that, upload and ask as usual.
        </p>
      </div>

      <div className="px-6 pb-16">
        <DemoWorkspace />
      </div>
    </main>
  );
}
