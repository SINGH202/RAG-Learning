# DocuMind — Requirements Document

> **Product:** DocuMind — hosted PDF Q&A platform built on the RAG-Learning project  
> **Version:** v1 (MVP)  
> **Last updated:** 2026-07-09  
> **Status:** Approved for implementation (not yet built)

---

## 1. Purpose

Transform the existing CLI RAG-Learning project into a **hosted, recruiter-friendly web demo** that:

- Accepts a PDF upload and answers questions grounded in that document
- Showcases full-stack + GenAI engineering skills to potential employers
- Runs on free/low-cost hosting (Vercel + Render)
- Supports a hybrid API key model so visitors can try the demo without their own key

---

## 2. Stakeholders & Users

| User | Goal |
|------|------|
| **Recruiter / hiring manager** | Try the demo in under 60 seconds; assess technical depth |
| **Developer (you)** | Maintain, extend, and deploy; resume work from docs alone |
| **Power user** | Continue using the app after server rate limits by supplying their own Google API key |

---

## 3. Scope

### 3.1 v1 — In Scope (MUST build)

| ID | Requirement | Priority |
|----|-------------|----------|
| R-01 | User can upload a single PDF (max 10 MB) via web UI | Must |
| R-02 | Backend parses PDF, chunks, embeds, and indexes in a session-scoped in-memory vector store | Must |
| R-03 | User can ask natural-language questions about the uploaded PDF | Must |
| R-04 | Answers are grounded in retrieved chunks with **citations** (chunk text + page/section metadata) | Must |
| R-05 | Model replies *"I don't know based on the provided document."* when answer is not in context | Must |
| R-06 | Hybrid API key: server `GOOGLE_API_KEY` by default; user can paste own key on rate-limit | Must |
| R-07 | User-provided API key is sent per-request only — **never stored** server-side | Must |
| R-08 | Session TTL: 30 minutes idle; auto-cleanup of in-memory index | Must |
| R-09 | Rate limit: 20 requests/hour/IP when using server key | Must |
| R-10 | Portfolio landing page with project description, tech stack, GitHub link, live demo | Must |
| R-11 | Deploy frontend to Vercel, backend to Render | Must |
| R-12 | Preserve original CLI learning project under `cli/` | Must |
| R-13 | Monorepo structure: `packages/rag-core`, `apps/api`, `apps/web`, `cli/` | Must |

### 3.2 v1 — Out of Scope (MUST NOT build now)

| ID | Requirement | Planned version |
|----|-------------|-----------------|
| O-01 | Chat history persisted across browser sessions | v2 |
| O-02 | Multiple PDFs per session | v2 |
| O-03 | Persistent vector store (disk/DB) across sessions | v2 |
| O-04 | User authentication (OAuth / email) | v3 |
| O-05 | Saved projects and document libraries | v3 |
| O-06 | Multi-user shared workspaces | v3 |
| O-07 | Streaming responses | v1.1 (nice-to-have) |
| O-08 | Conversation memory (multi-turn context) | v2 |

---

## 4. Functional Requirements (Detail)

### 4.1 PDF Upload & Indexing

1. User selects a `.pdf` file (reject non-PDF with clear error).
2. Frontend sends `multipart/form-data` to `POST /api/v1/sessions`.
3. Backend:
   - Validates file size ≤ 10 MB
   - Extracts text via `pypdf`
   - Splits with `RecursiveCharacterTextSplitter` (chunk_size=1000, overlap=200)
   - Embeds with `sentence-transformers/all-MiniLM-L6-v2`
   - Stores in ChromaDB **in-memory** collection keyed by `session_id`
4. Response: `{ session_id, chunk_count, filename, ready: true }`
5. Indexing should complete within ~30s for a typical 10-page PDF.

### 4.2 Question & Answer

1. User types a question in chat UI.
2. Frontend sends `POST /api/v1/sessions/{session_id}/ask` with `{ question }`.
3. Backend:
   - Validates session exists and is not expired
   - MMR retrieval (k=3, fetch_k=10)
   - Builds grounded prompt (same pattern as current `src/rag.py`)
   - Calls Gemini `gemini-2.5-flash` (temperature=0.3)
4. Response:
   ```json
   {
     "answer": "...",
     "citations": [
       { "chunk_index": 0, "text": "...", "page": 2, "score": 0.87 }
     ],
     "session_id": "..."
   }
   ```

### 4.3 Hybrid API Key

| Mode | Trigger | Key source | Storage |
|------|---------|------------|---------|
| **Server key** | Default | `GOOGLE_API_KEY` env on Render | Server env only |
| **User key** | 429 from server key OR user toggles "Use my key" | `X-User-Api-Key` request header | Never stored; session-scoped in frontend memory only |

On 429:
```json
{
  "error": "rate_limit_exceeded",
  "message": "Server demo limit reached. Paste your Google API key to continue.",
  "use_own_key": true
}
```

### 4.4 Session Lifecycle

```
CREATE  → upload PDF, receive session_id
ACTIVE  → ask questions (resets idle timer)
EXPIRED → 30 min idle → in-memory index deleted
DELETE  → explicit DELETE /sessions/{id} or tab close (best-effort)
```

---

## 5. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Time to first answer (after upload) | < 5s for Q&A step |
| NFR-02 | PDF indexing time (10 pages) | < 30s |
| NFR-03 | Uptime (free tier) | Best effort; cold start acceptable |
| NFR-04 | Security: no API keys in logs | Mandatory |
| NFR-05 | Security: CORS restricted to Vercel domain | Mandatory |
| NFR-06 | Security: file type validation | PDF only |
| NFR-07 | Accessibility: keyboard-navigable chat UI | Should |
| NFR-08 | Mobile-responsive layout | Should |

---

## 6. API Contract (v1)

### `GET /api/v1/health`
- **Response:** `{ "status": "ok" }`

### `POST /api/v1/sessions`
- **Body:** `multipart/form-data` — field `file` (PDF)
- **Headers:** optional `X-User-Api-Key`
- **Response 201:** `{ session_id, chunk_count, filename, ready }`
- **Errors:** 400 (invalid file), 413 (too large), 500 (processing failed)

### `POST /api/v1/sessions/{session_id}/ask`
- **Body:** `{ "question": "string" }` (min 2 chars)
- **Headers:** optional `X-User-Api-Key`
- **Response 200:** `{ answer, citations[], session_id }`
- **Errors:** 404 (session not found/expired), 429 (rate limit), 400 (empty question)

### `DELETE /api/v1/sessions/{session_id}`
- **Response 204:** session cleaned up

---

## 7. Tech Stack

| Layer | Technology | Version / notes |
|-------|-----------|-----------------|
| Frontend | Next.js | 15, App Router |
| UI | React, TypeScript, Tailwind CSS | — |
| Backend | FastAPI | Python 3.11 |
| RAG core | LangChain + existing `src/` modules | Extracted to `packages/rag-core` |
| PDF parsing | pypdf | New dependency |
| Embeddings | HuggingFace `all-MiniLM-L6-v2` | 384-dim, same as CLI |
| Vector store | ChromaDB in-memory | Per session (v1); disk persist in v2 |
| LLM | Google Gemini `gemini-2.5-flash` | temperature=0.3 |
| Frontend hosting | Vercel | Free tier |
| Backend hosting | Render | Free tier |
| CI | GitHub Actions | Lint + basic tests |

---

## 8. Repository Structure (Target Monorepo)

```
RAG-Learning/
├── README.md
├── docs/
│   ├── requirements.md          ← this file
│   ├── architecture.md
│   ├── implementation-plan.md
│   └── learning-notes.md
├── packages/rag-core/
│   └── src/                     ← from current src/
├── apps/
│   ├── api/                     ← FastAPI (Render)
│   └── web/                     ← Next.js (Vercel)
├── cli/                         ← original main.py + data/
└── .github/workflows/
```

---

## 9. Future Roadmap (Documented, NOT in v1 scope)

### v2 — Session History
- Chat history per uploaded PDF (same browser session)
- Persistent ChromaDB on disk or managed vector DB
- Multiple PDFs per session

### v3 — User Accounts
- Google OAuth or email auth
- Saved projects and document libraries
- Multi-user shared workspaces

---

## 10. Success Criteria (v1 Done)

- [ ] Live URL on Vercel loads portfolio + demo
- [ ] Upload PDF → ask question → cited answer in < 60s total (recruiter flow)
- [ ] Rate limit triggers user-key fallback UI
- [ ] Original CLI still runs from `cli/`
- [ ] All docs in `docs/` are sufficient to resume work without chat history
- [ ] GitHub README shows roadmap with v2/v3 marked as planned

---

## 11. Open Decisions (Resolved)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture approach | Stateless session RAG (Approach 1) | Fast to ship; fits recruiter demo |
| Hosting | Vercel + Render free tier | Low cost; portfolio-friendly |
| API key model | Hybrid (server default + user override) | Smooth demo + power users |
| Repo structure | Monorepo Option A | Future-proof for v2/v3 |
| Output quality | Balanced speed + citations | Best demo impact |
| v1 scope | Upload + Q&A + citations + key toggle | Defer history/auth to v2/v3 |
