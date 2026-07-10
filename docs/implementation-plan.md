# DocuMind — Implementation Plan

> **Last updated:** 2026-07-11  
> **Prerequisite:** Read [requirements.md](./requirements.md) and [architecture.md](./architecture.md)  
> **Status:** v1 + v2 (multi-PDF, history, streaming) shipped. Next: persistent vector store, then auth (v3).  
> **How to resume:** Prefer roadmap in README / requirements §9 over unchecked Phase boxes below (many Phase 0–5 items are done).

---

## Quick Resume Checklist

When returning to this project after a break:

1. Read `docs/requirements.md` — confirm scope hasn't changed
2. Read `docs/architecture.md` — refresh on system design
3. Find the first unchecked `[ ]` phase in this file
4. Run CLI to verify rag-core still works: `cd cli && python main.py`
5. Check env: `.env` has `GOOGLE_API_KEY`; Render/Vercel env vars if deployed

---

## Phase 0: Repo Cleanup & Restructure

**Goal:** Monorepo layout without breaking the CLI.

### 0.1 Pre-restructure safety

- [ ] Tag current state: `git tag v0.1-cli`
- [ ] Verify CLI works: `python main.py` (from current root)

### 0.2 Create monorepo directories

```bash
mkdir -p packages/rag-core/src
mkdir -p packages/rag-core/experiments
mkdir -p apps/api
mkdir -p apps/web
mkdir -p cli/data
mkdir -p docs/superpowers/specs
mkdir -p .github/workflows
```

### 0.3 Move files

| From | To |
|------|-----|
| `src/*` | `packages/rag-core/src/` |
| `experiments/*` | `packages/rag-core/experiments/` |
| `main.py` | `cli/main.py` |
| `test_llm.py` | `cli/test_llm.py` |
| `data/*` | `cli/data/` |
| `src/download_document.py` | `cli/download_document.py` (CLI-only) |

### 0.4 Update imports

- [ ] `packages/rag-core/src/config.py` — fix `BASE_DIR` paths for new layout
- [ ] `cli/main.py` — import from `rag_core` package (or relative path)
- [ ] Add `packages/rag-core/pyproject.toml` with package name `rag-core`

### 0.5 Remove unnecessary files

| Action | Path | Reason |
|--------|------|--------|
| Delete | `.superpowers/brainstorm/` | Brainstorming artifacts |
| Delete | `what&why.md` | Superseded by `docs/learning-notes.md` |
| Keep gitignored | `venv/`, `chroma_db/`, `.env` | Local only |

### 0.6 Update `.gitignore`

Add:
```
.superpowers/
apps/web/.next/
apps/web/node_modules/
apps/api/__pycache__/
*.egg-info/
```

### 0.7 Verify CLI still works

```bash
cd cli
python main.py
# Ask a test question, confirm answer
```

### 0.8 Commit

```
git add -A
git commit -m "chore: restructure to monorepo (Phase 0)"
```

---

## Phase 1: rag-core Enhancements

**Goal:** Extend shared library for PDF + in-memory sessions + citations.

### 1.1 PDF loader

- [ ] Add `pypdf` to `packages/rag-core` dependencies
- [ ] Extend `loader.py` with `load_pdf(file_bytes) -> list[Document]`
- [ ] Attach `metadata={"page": N, "source": filename}` per page/chunk

### 1.2 In-memory vector store

- [ ] Add `create_session_store(chunks, session_id) -> Chroma` in `vector_store.py`
- [ ] Use `chromadb.Client()` ephemeral mode (no persist_directory)

### 1.3 LLM with optional API key

- [ ] Update `get_llm(api_key: str | None = None)` — use param over env

### 1.4 Citations in RAG response

- [ ] Change `ask()` return type to `{ answer: str, citations: list[Citation] }`
- [ ] Citation = `{ chunk_index, text, page, score }`

### 1.5 CLI compatibility

- [ ] Update `cli/main.py` to handle new `ask()` return shape
- [ ] Verify CLI Q&A still works

### 1.6 Commit

```
git commit -m "feat(rag-core): PDF loader, in-memory store, citations"
```

---

## Phase 2: FastAPI Backend (`apps/api`)

**Goal:** REST API with session management.

### 2.1 Scaffold

- [ ] `apps/api/main.py` — FastAPI app, CORS, lifespan
- [ ] `apps/api/requirements.txt` — fastapi, uvicorn, rag-core (editable install)
- [ ] `apps/api/Dockerfile` — Python 3.11 slim

### 2.2 Session manager

- [ ] `services/session_manager.py` — dict of sessions + TTL cleanup background task
- [ ] Session model: `{ id, vector_store, filename, created_at, last_active }`

### 2.3 Routes

- [ ] `GET /api/v1/health`
- [ ] `POST /api/v1/sessions` — upload PDF, return session_id
- [ ] `POST /api/v1/sessions/{id}/ask` — question → answer + citations
- [ ] `DELETE /api/v1/sessions/{id}` — cleanup

### 2.4 Middleware

- [ ] Rate limiter: 20 req/hr/IP for server-key requests
- [ ] API key resolver: header `X-User-Api-Key` overrides env key

### 2.5 Error handling

- [ ] 400 invalid file / empty question
- [ ] 404 session not found/expired
- [ ] 413 file too large
- [ ] 429 rate limit with `{ use_own_key: true }`

### 2.6 Local test

```bash
cd apps/api
uvicorn main:app --reload --port 8000

# Upload
curl -X POST http://localhost:8000/api/v1/sessions \
  -F "file=@test.pdf"

# Ask
curl -X POST http://localhost:8000/api/v1/sessions/{id}/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic?"}'
```

### 2.7 Commit

```
git commit -m "feat(api): FastAPI session RAG endpoints"
```

---

## Phase 3: Next.js Frontend (`apps/web`)

**Goal:** Portfolio landing + demo UI.

### 3.1 Scaffold

```bash
cd apps/web
npx create-next-app@latest . --typescript --tailwind --app --src-dir
```

### 3.2 Pages

- [ ] `app/page.tsx` — portfolio landing (hero, tech stack, GitHub, CTA)
- [ ] `app/demo/page.tsx` — upload + chat interface

### 3.3 Components

- [ ] `PdfUploader` — drag-and-drop, upload progress, error states
- [ ] `ChatPanel` — message list, input, loading state
- [ ] `CitationCard` — expandable source chunk with page number
- [ ] `ApiKeyToggle` — collapsible key input; auto-show on 429

### 3.4 API client

- [ ] `lib/api.ts` — typed wrappers for all endpoints
- [ ] Store `session_id` in React state (not localStorage for v1)
- [ ] Store user API key in component state only (never localStorage)

### 3.5 UX polish

- [ ] Loading spinner during PDF indexing
- [ ] Empty state before upload
- [ ] Error toast for failed requests
- [ ] Mobile-responsive layout

### 3.6 Local test

```bash
# Terminal 1: API on :8000
# Terminal 2:
cd apps/web
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

### 3.7 Commit

```
git commit -m "feat(web): portfolio landing + PDF Q&A demo UI"
```

---

## Phase 4: Deploy

**Goal:** Live demo URLs for resume/LinkedIn.

### 4.1 Render (backend)

- [ ] Connect GitHub repo to Render
- [ ] Set root directory: `apps/api`
- [ ] Set env vars: `GOOGLE_API_KEY`, `CORS_ORIGINS`, `SESSION_TTL_MINUTES`, `RATE_LIMIT_PER_HOUR`
- [ ] Deploy; note API URL

### 4.2 Vercel (frontend)

- [ ] Connect GitHub repo to Vercel
- [ ] Set root directory: `apps/web`
- [ ] Set env: `NEXT_PUBLIC_API_URL=<Render URL>`
- [ ] Deploy; note web URL

### 4.3 Update README

- [ ] Add live demo link
- [ ] Add deployment badges
- [ ] Verify roadmap section is present

### 4.4 Smoke test on production

- [ ] Upload PDF on live URL
- [ ] Ask question, verify citations
- [ ] Verify 429 → user key prompt (may need to hit limit)

### 4.5 Commit

```
git commit -m "docs: add live demo links and deployment info"
```

---

## Phase 5: CI & Polish

- [ ] GitHub Actions: lint Python (ruff), lint TypeScript (eslint)
- [ ] Basic API test: health endpoint
- [ ] Update root README with architecture diagram link
- [ ] Final review of all `docs/` files

---

## File Cleanup Reference

Files to remove during Phase 0:

```
.superpowers/                  # brainstorming artifacts
what&why.md                    # merged into docs/learning-notes.md
```

Files that stay gitignored (never commit):

```
venv/
chroma_db/
.env
apps/web/node_modules/
apps/web/.next/
```

---

## Environment Variables Reference

### Local development (`.env` at repo root or `apps/api/.env`)

```env
GOOGLE_API_KEY=your_key_here
CORS_ORIGINS=http://localhost:3000
SESSION_TTL_MINUTES=30
RATE_LIMIT_PER_HOUR=20
MAX_PDF_SIZE_MB=10
```

### Vercel

```env
NEXT_PUBLIC_API_URL=https://documind-api.onrender.com
```

### Render

```env
GOOGLE_API_KEY=...
CORS_ORIGINS=https://documind.vercel.app
SESSION_TTL_MINUTES=30
RATE_LIMIT_PER_HOUR=20
MAX_PDF_SIZE_MB=10
```

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| CLI import errors after restructure | Wrong `BASE_DIR` in config | Update `packages/rag-core/src/config.py` paths |
| ChromaDB memory leak | Sessions not expiring | Check background TTL task is running |
| CORS errors in browser | Wrong `CORS_ORIGINS` | Match exact Vercel URL (no trailing slash) |
| Render cold start timeout | Free tier spin-down | Retry; or upgrade to paid tier |
| Gemini 429 | Server key quota | Use user key fallback |
| PDF text empty | Scanned PDF (no text layer) | Show error: "PDF has no extractable text" |

---

## What Comes After v1

See [requirements.md §9](./requirements.md#9-roadmap-status):

- **v2 (shipped):** Session history, multi-PDF, streaming answers
- **Deferred:** Persistent vector store across API restarts
- **v3 (planned):** Auth, saved projects, shared workspaces

v1 is deployed. Continue with persistent store, then auth.
