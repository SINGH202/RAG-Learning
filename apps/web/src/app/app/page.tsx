"use client";

import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ApiError,
  createProject,
  listProjects,
  type ProjectSummary,
} from "@/lib/api";

export default function AppProjectsPage() {
  const { getToken, isLoaded } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in.");
      const rows = await listProjects(token);
      setProjects(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded) void load();
  }, [isLoaded, load]);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in.");
      const project = await createProject(name || "Untitled project", token);
      setName("");
      setProjects((current) => [project, ...current]);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to create project.",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="font-display text-2xl tracking-tight text-ink">
          DocuMind
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/demo" className="text-ink/70 transition hover:text-ink">
            Guest demo
          </Link>
          <UserButton />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-6 pb-16">
        <h1 className="font-display text-3xl text-ink md:text-4xl">Your projects</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/65">
          Durable PDF libraries with invite-link sharing. Guest demo remains
          available without an account.
        </p>

        <form onSubmit={onCreate} className="mt-8 flex flex-wrap gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            className="min-w-[220px] flex-1 rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {creating ? "Creating…" : "New project"}
          </button>
        </form>

        {error ? (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-8 space-y-3">
          {loading ? (
            <p className="text-sm text-ink/55">Loading projects…</p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-ink/55">
              No projects yet. Create one to upload PDFs.
            </p>
          ) : (
            projects.map((project) => (
              <Link
                key={project.project_id}
                href={`/app/projects/${project.project_id}`}
                className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white/70 px-5 py-4 transition hover:border-teal/40"
              >
                <div>
                  <p className="font-medium text-ink">{project.name}</p>
                  <p className="mt-1 text-xs text-ink/50">
                    {project.role} · {project.document_count} document
                    {project.document_count === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="text-sm text-teal">Open →</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
