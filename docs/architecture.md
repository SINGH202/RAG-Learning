# DocuMind — Architecture Document

> **Last updated:** 2026-07-11  
> **Status:** Reflects shipped v1 + v2 (multi-PDF, history, streaming). Persistent vector store still deferred.

---

## 1. System Overview

DocuMind is a session-scoped RAG web application. Each upload session holds one or more PDFs in an isolated in-memory Chroma collection (Gemini embeddings on the API). Questions are answered by retrieving relevant chunks and calling Google Gemini with a grounded prompt. The demo streams status, citations, and answer tokens over SSE. Chat UI state is persisted in the browser for 7 days; the server index still expires on idle TTL or process restart.

```
┌─────────────────────────────────────────────────────────────────┐
│                     VERCEL (Frontend)                           │
│  Next.js · React · Tailwind · TypeScript                        │
│                                                                 │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────────────────┐   │
│  │ Landing  │  │ Multi-PDF    │  │ Streaming chat +        │   │
│  │ (portfolio│  │ upload +     │  │ citations + localStorage│   │
│  │  showcase)│  │ API key      │  │ history (7 days)        │   │
│  └──────────┘  └──────────────┘  └─────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS REST + SSE
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   RENDER (Backend API)                          │
│  FastAPI · Python 3.11 · packages/rag-core                      │
│                                                                 │
│  POST /api/v1/sessions                 → first PDF + session    │
│  POST /api/v1/sessions/{id}/documents  → add PDF to session     │
│  GET  /api/v1/sessions/{id}/documents  → list docs              │
│  POST /api/v1/sessions/{id}/ask        → JSON answer+citations  │
│  POST /api/v1/sessions/{id}/ask/stream → SSE status/cites/tokens│
│  DELETE /api/v1/sessions/{id}          → cleanup                │
│  GET  /api/v1/health                   → health check           │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ PDF Parser  │→ │ Chunker      │→ │ ChromaDB (in-memory  │   │
│  │ (pypdf)     │  │ (recursive)  │  │  per session, TTL)   │   │
│  └─────────────┘  └──────────────┘  └──────────────────────┘   │
│                        │                                        │
│                        ▼                                        │
│              ┌──────────────────┐                               │
│              │ RAG Pipeline     │                               │
│              │ similarity +     │                               │
│              │ optional doc     │                               │
│              │ filter → prompt  │                               │
│              │ → LLM (stream)   │                               │
│              └────────┬─────────┘                               │
│                       ▼                                         │
│              ┌──────────────────┐                               │
│              │ Google Gemini    │  ← server key OR user key     │
│              │ gemini-2.5-flash │  + gemini-embedding-001       │
│              └──────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Breakdown

### 2.1 `apps/web` (Next.js on Vercel)

| Component | Responsibility |
|-----------|----------------|
| `app/page.tsx` | Portfolio landing — hero, tech stack, GitHub, live demo CTA |
| `app/demo/page.tsx` | Demo shell |
| `components/DemoWorkspace` | Multi-PDF session, filter, localStorage, streaming ask |
| `components/PdfUploader` | PDF upload (add first or additional) |
| `components/ChatPanel` | Streaming chat, status phases, citation cards |
| `components/ApiKeyToggle` | Optional user API key input (shown on 429 or manual toggle) |
| `lib/api.ts` | Typed fetch + SSE client for backend API |
| `lib/demoStorage.ts` | 7-day `localStorage` persistence for chat/docs |

**Environment variables (Vercel):**
```
NEXT_PUBLIC_API_URL=https://your-api.onrender.com
```

### 2.2 `apps/api` (FastAPI on Render)

| Module | Responsibility |
|--------|----------------|
| `main.py` | App factory, CORS, lifespan |
| `routes/sessions.py` | Upload, add docs, ask, ask/stream, delete |
| `services/session_manager.py` | In-memory multi-doc sessions + TTL cleanup |
| `services/pdf_service.py` | PDF extract/chunk/index (create or append) |
| `services/rag_service.py` | Sync ask + streaming ask wrappers |
| `services/rag_service.py` | Orchestrates rag-core: chunk → embed → retrieve → answer |
| `middleware/rate_limit.py` | IP-based rate limiting for server key usage |
| `Dockerfile` | Container for Render deploy |

**Environment variables (Render):**
```
GOOGLE_API_KEY=...
CORS_ORIGINS=https://your-app.vercel.app
SESSION_TTL_MINUTES=30
RATE_LIMIT_PER_HOUR=20
MAX_PDF_SIZE_MB=10
```

### 2.3 `packages/rag-core` (Shared Python library)

Extracted from current `src/`. Used by both `apps/api` and `cli/`.

| Module | Current file | Changes for platform |
|--------|-------------|----------------------|
| `config.py` | `src/config.py` | Add PDF settings; paths become configurable |
| `loader.py` | `src/loader.py` | Add PDF loader via pypdf |
| `splitter.py` | `src/splitter.py` | No change |
| `vector_store.py` | `src/vector_store.py` | Add `create_in_memory_store()` for sessions |
| `retriever.py` | `src/retriever.py` | No change (MMR k=3, fetch_k=10) |
| `llm.py` | `src/llm.py` | Accept optional `api_key` parameter |
| `rag.py` | `src/rag.py` | Return citations alongside answer |

**RAG config (inherited from CLI):**

| Setting | Value |
|---------|-------|
| Embedding model (CLI) | `sentence-transformers/all-MiniLM-L6-v2` |
| Embedding model (API) | `models/gemini-embedding-001` (no Torch on Render) |
| LLM model | `gemini-2.5-flash` |
| LLM temperature | `0.3` |
| Chunk size | `1000` |
| Chunk overlap | `200` |
| API retrieve | Similarity search with scores, `k=3` |
| CLI retrieve | MMR, `k=3`, `fetch_k=10` |

### 2.4 `cli/` (Preserved learning project)

Original `main.py` flow unchanged:
1. Download sample document
2. Load/create persistent ChromaDB in `cli/chroma_db/`
3. Interactive Q&A loop

---

## 3. Data Flow

### 3.1 Upload & Index Flow

```
User selects PDF
    → If no session: POST /api/v1/sessions (multipart)
    → If session exists: POST /api/v1/sessions/{id}/documents
    → API: validate size + type
    → pdf_service: extract text (pypdf) → chunks with document_id + source metadata
    → rag-core: Gemini embeddings → Chroma in-memory (create or append)
    → session_manager: store documents[] on session
    → Response: { session_id, documents[], chunk_count, filename, ready }
```

### 3.2 Ask Flow (JSON)

```
User types question
    → Frontend may use stream (demo) or JSON /ask
    → POST /api/v1/sessions/{id}/ask
         { question, document_id?, history?: last 4 }
    → API: resolve session, optional doc filter, rate limit
    → rag-core: similarity search → grounded prompt (+ history) → Gemini
    → Response: { answer, citations[], session_id }
```

### 3.3 Ask Flow (SSE — demo)

```
POST /api/v1/sessions/{id}/ask/stream  (same body as /ask)
    → status: retrieving
    → citations: [ ... ]     (shown immediately in UI)
    → status: generating
    → token: "..."           (repeated)
    → done: { session_id }
```

### 3.4 API Key Resolution

```
Request arrives
    → If X-User-Api-Key header present → use user key (skip rate limit)
    → Else → use GOOGLE_API_KEY from env
        → If rate limit exceeded → 429 + use_own_key: true
        → If Gemini returns 429 → forward with use_own_key hint
```

### 3.5 Session Expiry

```
Server (every cleanup interval):
    → Sessions idle > 30 min → delete Chroma collection + session

Browser:
    → localStorage key documind.v2 expires after 7 days
    → If server session gone (404), UI keeps chat and prompts re-upload
```

---

## 4. Deployment Architecture

```
GitHub (RAG-Learning repo)
    │
    ├── push to main
    │       ├── Vercel: auto-deploy apps/web
    │       └── Render: auto-deploy apps/api (via Dockerfile)
    │
    └── GitHub Actions: lint + test on PR

Vercel                          Render
├── Static + SSR (Next.js)      ├── FastAPI container
├── Edge CDN                    ├── 512 MB RAM (free tier)
└── NEXT_PUBLIC_API_URL ────────┘   CORS_ORIGINS → Vercel URL
```

**Cold start note:** Render free tier spins down after 15 min idle. First request may take 30–60s. Acceptable for portfolio demo; document in README.

---

## 5. Security Considerations

| Concern | Mitigation |
|---------|------------|
| API key leakage | User keys in header only; never logged; never persisted |
| File upload abuse | PDF-only validation; 10 MB cap; rate limiting |
| CORS | Restrict to Vercel production URL |
| Session hijacking | Random UUID session IDs; no sensitive data in sessions |
| Prompt injection | Grounded prompt instructs model to use context only |
| Dependency risk | Pin versions in requirements; CI audit |

---

## 6. Evolution Path

### Shipped in v2 (current)
- Multi-PDF sessions + optional `document_id` filter
- Browser chat history (`localStorage`, 7 days)
- Last-4 message history on ask + always re-retrieve
- SSE streaming (`/ask/stream`)

### Still deferred (persist)
- Disk / managed persistent vector store across API restarts

### v3 changes to architecture
- Add auth service (NextAuth.js or Clerk)
- Add PostgreSQL for users, projects, documents
- Vector store becomes per-user/per-project instead of per-session
- New `apps/api/routes/projects.py`, `routes/auth.py`

---

## 7. Key Design Decisions

| # | Decision | Alternatives considered | Why this choice |
|---|----------|------------------------|-----------------|
| 1 | Stateless sessions | Persistent DB from day 1 | Faster v1; sufficient for demo |
| 2 | Monorepo | Separate repos; flat layout | One GitHub link; scales to v2/v3 |
| 3 | Reuse rag-core | Rewrite RAG in API | Proves learning → production path |
| 4 | ChromaDB in-memory | Pinecone, Qdrant | Zero cost; matches existing CLI stack |
| 5 | FastAPI | Flask, Django | Async-ready; modern; good for ML APIs |
| 6 | Next.js on Vercel | Streamlit, plain React | Better portfolio signal; SSR landing |
| 7 | Hybrid API key | Server-only; user-only | Best UX for recruiters + power users |

---

## 8. Related Documents

- [Requirements](./requirements.md) — full feature list and API contract
- [Implementation Plan](./implementation-plan.md) — phased build steps
- [Design Spec](./superpowers/specs/2026-07-09-documind-design.md) — brainstorming output
- [Learning Notes](./learning-notes.md) — RAG concepts from original learning journey
