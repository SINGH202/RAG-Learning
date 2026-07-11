"use client";

import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { ProjectWorkspace } from "@/components/ProjectWorkspace";

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const { getToken, isLoaded } = useAuth();
  const projectId = params.id;

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <Link href="/app" className="font-display text-2xl tracking-tight text-ink">
          DocuMind
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/app" className="text-ink/70 transition hover:text-ink">
            Projects
          </Link>
          <UserButton />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-6 pb-8">
        {!isLoaded ? (
          <p className="text-sm text-ink/55">Loading…</p>
        ) : (
          <ProjectWorkspace projectId={projectId} getToken={getToken} />
        )}
      </div>
    </main>
  );
}
