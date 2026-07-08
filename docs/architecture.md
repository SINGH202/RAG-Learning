# DocuMind — Architecture Document

> **Last updated:** 2026-07-09  
> **Status:** Approved design — implementation not started

---

## 1. System Overview

DocuMind is a stateless, session-scoped RAG web application. Each PDF upload creates an isolated in-memory vector index. Questions are answered by retrieving relevant chunks and calling Google Gemini with a grounded prompt.

```
┌─────────────────────────────────────────────────────────────────┐
│                     VERCEL (Frontend)                           │
│  Next.js 15 · React · Tailwind · TypeScript                     │
│                                                                 │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────────────────┐   │
│  │ Landing  │  │ PDF Upload   │  │ Chat + Citations UI     │   │
│  │ (portfolio│  │ + API Key    │  │                         │   │
│  │  showcase)│  │ toggle       │  │                         │   │
│  └──────────┘  └──────────────┘  └─────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   RENDER (Backend API)                          │
│  FastAPI · Python 3.11 · packages/rag-core                    │
│                                                                 │
│  POST /api/v1/sessions          → upload PDF, return session_id │
│  POST /api/v1/sessions/{id}/ask → question → answer + citations│
│  DELETE /api/v1/sessions/{id}   → cleanup                       │
│  GET  /api/v1/health            → health check                  │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ PDF Parser  │→ │ Chunker      │→ │ ChromaDB (in-memory  │   │
│  │ (pypdf)     │  │ (recursive)  │  │  per session, TTL)   │   │
│  └─────────────┘  └──────────────┘  └──────────────────────┘   │
│                        │                                        │
│                        ▼                                        │
│              ┌──────────────────┐                               │
│              │ RAG Pipeline     │                               │
│              │ MMR retriever    │                               │
│              │ → prompt → LLM   │                               │
│              └────────┬─────────┘                               │
│                       ▼                                         │
│              ┌──────────────────┐                               │
│              │ Google Gemini    │  ← server key OR user key     │
│              │ gemini-2.5-flash │                               │
│              └──────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Breakdown

### 2.1 `apps/web` (Next.js on Vercel)

| Component | Responsibility |
|-----------|----------------|
| `app/page.tsx` | Portfolio landing — hero, tech stack, GitHub, live demo CTA |
| `app/demo/page.tsx` | Upload + chat interface |
| `components/PdfUploader` | Drag-and-drop PDF upload, progress state |
| `components/ChatPanel` | Question input, answer display, citation cards |
| `components/ApiKeyToggle` | Optional user API key input (shown on 429 or manual toggle) |
| `lib/api.ts` | Typed fetch wrapper for backend API |

**Environment variables (Vercel):**
```
NEXT_PUBLIC_API_URL=https://your-api.onrender.com
```

### 2.2 `apps/api` (FastAPI on Render)

| Module | Responsibility |
|--------|----------------|
| `main.py` | App factory, CORS, lifespan |
| `routes/sessions.py` | Upload, ask, delete endpoints |
| `services/session_manager.py` | In-memory session store + TTL cleanup |
| `services/pdf_service.py` | PDF text extraction via pypdf |
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
| Embedding model | `sentence-transformers/all-MiniLM-L6-v2` |
| LLM model | `gemini-2.5-flash` |
| LLM temperature | `0.3` |
| Chunk size | `1000` |
| Chunk overlap | `200` |
| Retriever type | MMR |
| Retriever k | `3` |
| Retriever fetch_k | `10` |

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
    → Frontend: POST /api/v1/sessions (multipart)
    → API: validate size + type
    → pdf_service: extract text (pypdf) → LangChain Documents with page metadata
    → rag-core splitter: RecursiveCharacterTextSplitter
    → rag-core vector_store: ChromaDB in-memory collection
    → session_manager: store { session_id → vector_store, created_at, last_active }
    → Response: { session_id, chunk_count, filename, ready }
```

### 3.2 Ask Flow

```
User types question
    → Frontend: POST /api/v1/sessions/{id}/ask { question }
    → API: resolve session, check TTL
    → rate_limit: check IP quota (if using server key)
    → rag-core retriever: MMR search → top 3 chunks
    → rag-core rag: build grounded prompt
    → rag-core llm: Gemini invoke (server or user key)
    → API: format citations from retrieved docs
    → Response: { answer, citations[], session_id }
    → session_manager: update last_active timestamp
```

### 3.3 API Key Resolution

```
Request arrives
    → If X-User-Api-Key header present → use user key (skip rate limit)
    → Else → use GOOGLE_API_KEY from env
        → If rate limit exceeded → 429 + use_own_key: true
        → If Gemini returns 429 → forward with use_own_key hint
```

### 3.4 Session Expiry

```
Background task (every 5 min):
    → For each session where (now - last_active) > 30 min:
        → Delete ChromaDB collection
        → Remove session from memory dict
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

## 6. Evolution Path (v2 → v3)

### v2 changes to architecture
- Replace in-memory ChromaDB with persistent store (disk or Pinecone/Qdrant)
- Add `POST /sessions/{id}/messages` history endpoint
- Frontend: chat history state persisted in `sessionStorage`

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
