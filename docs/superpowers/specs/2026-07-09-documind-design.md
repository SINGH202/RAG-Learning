# DocuMind Platform — Design Specification

> **Date:** 2026-07-09  
> **Status:** Approved — ready for implementation  
> **Author:** Brainstorming session (Cursor)

---

## Executive Summary

Build **DocuMind**, a hosted PDF Q&A platform on top of the existing RAG-Learning CLI project. Target users are recruiters evaluating engineering skills. v1 delivers upload → ask → cited answers with hybrid API key support, deployed on Vercel + Render free tier.

---

## Problem Statement

The RAG-Learning project demonstrates deep understanding of RAG internals but only runs as a local CLI with a pre-loaded text file. To attract hiring interest, it needs a web-facing demo that recruiters can try in under 60 seconds without setup.

---

## Goals

1. Host a live demo showcasing RAG + full-stack skills
2. Reuse existing modular RAG code (not rewrite)
3. Ship fast with free hosting
4. Document everything so work can resume without chat context
5. Plan v2/v3 without building them now

---

## Non-Goals (v1)

- User authentication
- Persistent chat history
- Multiple PDFs per session
- Streaming responses
- Paid infrastructure

---

## Approved Decisions

| Topic | Decision |
|-------|----------|
| User flow | Recruiter demo: upload PDF → ask → cited answer |
| Architecture | Approach 1: Stateless session RAG API |
| API key | Hybrid: server default + user override on rate limit |
| Hosting | Vercel (frontend) + Render (backend) |
| Quality | Balanced speed + citations |
| v1 scope | Upload, Q&A, citations, key toggle, rate limiting |
| Repo structure | Monorepo Option A (`packages/`, `apps/`, `cli/`) |
| Future | v2 history, v3 auth — documented, not built |

---

## Architecture

See [architecture.md](../architecture.md) for full diagrams and component breakdown.

**High level:**
- `apps/web` (Next.js/Vercel) → REST → `apps/api` (FastAPI/Render) → `packages/rag-core` → Gemini

**Session model:**
- Each PDF upload creates `session_id` with in-memory ChromaDB
- 30 min idle TTL, then cleanup
- No persistence across browser sessions in v1

---

## Application Flow

### Happy path

1. User lands on portfolio page → clicks "Try Demo"
2. Uploads PDF → backend indexes → returns `session_id`
3. Asks question → backend retrieves chunks → Gemini answers with citations
4. User asks follow-ups in same session

### Rate limit path

1. Server key hits 20 req/hr/IP limit → 429 response
2. UI shows "Paste your Google API key to continue"
3. User provides key → subsequent requests use `X-User-Api-Key` header
4. Key never stored server-side

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, React, TypeScript, Tailwind |
| Backend | FastAPI, Python 3.11 |
| RAG | LangChain, ChromaDB, Sentence Transformers |
| LLM | Google Gemini `gemini-2.5-flash` |
| PDF | pypdf |
| Deploy | Vercel + Render |
| CI | GitHub Actions |

---

## API Endpoints

```
GET    /api/v1/health
POST   /api/v1/sessions              (upload PDF)
POST   /api/v1/sessions/{id}/ask     (question → answer + citations)
DELETE /api/v1/sessions/{id}         (cleanup)
```

Full contract in [requirements.md](../requirements.md#6-api-contract-v1).

---

## Monorepo Structure

```
RAG-Learning/
├── README.md
├── docs/
│   ├── requirements.md
│   ├── architecture.md
│   ├── implementation-plan.md
│   ├── learning-notes.md
│   └── superpowers/specs/2026-07-09-documind-design.md  (this file)
├── packages/rag-core/
│   ├── src/
│   └── experiments/
├── apps/
│   ├── api/
│   └── web/
├── cli/
│   ├── main.py
│   └── data/
└── .github/workflows/
```

---

## File Cleanup (Phase 0)

| Action | File |
|--------|------|
| Delete | `.superpowers/brainstorm/` |
| Delete | `what&why.md` (after merge to learning-notes) |
| Relocate | `src/*` → `packages/rag-core/src/` |
| Relocate | `main.py` → `cli/main.py` |
| Add to .gitignore | `.superpowers/` |

---

## Future Roadmap (Not v1)

### v2 — Session History
- Chat history per PDF (same browser session)
- Persistent vector store
- Multiple PDFs

### v3 — User Accounts
- OAuth auth
- Saved projects
- Shared workspaces

---

## Success Criteria

- [ ] Live demo URL works end-to-end
- [ ] Recruiter can upload PDF and get cited answer in < 60s
- [ ] Rate limit → user key fallback works
- [ ] CLI still runs from `cli/`
- [ ] All docs sufficient to resume without chat history

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [requirements.md](../requirements.md) | Full requirements + API contract |
| [architecture.md](../architecture.md) | System design + data flows |
| [implementation-plan.md](../implementation-plan.md) | Phased build checklist |
| [learning-notes.md](../learning-notes.md) | RAG learning journey notes |

---

## Next Step

After user reviews this spec → invoke **writing-plans** skill to create detailed task-by-task implementation plan for Phase 0.
