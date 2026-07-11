# DocuMind — RAG Learning → Production Platform

A **Retrieval-Augmented Generation (RAG)** project built from scratch, evolving from a CLI learning tool into a hosted **PDF Q&A web platform** for portfolio and hiring visibility.

| | |
|---|---|
| **Live demo** | [https://trydocumind.vercel.app](https://trydocumind.vercel.app) |
| **API** | [https://documind-api-e32e.onrender.com](https://documind-api-e32e.onrender.com/api/v1/health) |
| **What works today** | CLI + hosted API + Next.js demo (multi-PDF, streaming answers, citations, 7-day chat history) |
| **What's next** | Deploy Auth v3 (Clerk + Neon) to Vercel/Render |
| **Why it exists** | Learn RAG internals (no `RetrievalQA` black box) and showcase full-stack + GenAI skills |

**Stack:** LangChain · Sentence Transformers · ChromaDB · Google Gemini · FastAPI · Next.js

---

## Live Demo

| Surface | URL |
|---------|-----|
| **Frontend (Vercel)** | [https://trydocumind.vercel.app](https://trydocumind.vercel.app) |
| **Demo page** | [https://trydocumind.vercel.app/demo](https://trydocumind.vercel.app/demo) |
| **Backend API (Render)** | [https://documind-api-e32e.onrender.com](https://documind-api-e32e.onrender.com) |
| **API health** | [https://documind-api-e32e.onrender.com/api/v1/health](https://documind-api-e32e.onrender.com/api/v1/health) |

Upload one or more PDFs → ask questions → get streaming, grounded answers with source citations.  
Chat history stays in the browser for 7 days; the server index expires after ~30 minutes idle.  
With Backblaze B2 configured, PDFs are stored so a Render restart can re-index the same `session_id` within that TTL.  
Opening the demo pings `/health` so Render can wake before the first upload (cold start ~30–60s).

---

## Quick Start

**Prerequisites:** Python 3.11+, [Google AI API key](https://aistudio.google.com/apikey)

```bash
git clone https://github.com/SINGH202/RAG-Learning/
cd RAG-Learning

python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env            # add your GOOGLE_API_KEY

python cli/main.py              # interactive Q&A loop
```

On first run the CLI downloads a sample policy document, builds embeddings, and saves them to `cli/chroma_db/`. Later runs load the existing index instantly.

```bash
python cli/test_llm.py          # verify Gemini connection
```

### Run the API

```bash
pip install -r apps/api/requirements.txt
pip install -e packages/rag-core

cd apps/api
uvicorn main:app --reload --port 8000
```

See [apps/api/README.md](apps/api/README.md) for curl examples.

---

## Repository Layout

This is a **monorepo**. Each folder has one job:

```
RAG-Learning/
│
├── cli/                         # ✅ Working — terminal Q&A (original learning project)
│   ├── main.py                  #    Entry point
│   ├── data/                    #    Sample document
│   └── chroma_db/               #    Local vector DB (gitignored)
│
├── packages/rag-core/             # ✅ Working — shared RAG library
│   ├── src/rag_core/            #    loader, splitter, embeddings, retriever, llm, rag
│   └── experiments/             #    Learning scripts (similarity, chunk analysis)
│
├── apps/
│   ├── api/                     # ✅ FastAPI backend (Render)
│   └── web/                     # ✅ Next.js frontend (Vercel)
│
└── docs/                        # 📋 Platform specs — start here to resume development
    ├── requirements.md
    ├── architecture.md
    ├── implementation-plan.md   #    Phased checklist (Phase 0 done)
    └── learning-notes.md
```


| Folder                   | Purpose                                                  |
| ------------------------ | -------------------------------------------------------- |
| `**cli/**`               | Run RAG in the terminal — great for learning and testing |
| `**packages/rag-core/**` | Reusable RAG pipeline used by CLI and (future) API       |
| `**apps/api/**`          | REST API for PDF upload + Q&A ([live](https://documind-api-e32e.onrender.com)) |
| `**apps/web/**`          | Portfolio + demo UI ([live](https://trydocumind.vercel.app)) |
| `**docs/**`              | Requirements, architecture, implementation plan          |


---

## How RAG Works Here

```
Document → Chunk → Embed → ChromaDB → Retrieve (MMR) → Prompt + Context → Gemini → Answer
```

We implement every step manually in `packages/rag-core/src/rag_core/rag.py` — no `RetrievalQA.from_chain_type(...)`. That makes the pipeline transparent and easy to extend.

```
                User Question
                      │
                      ▼
                Retriever (MMR, k=3)
                      │
                      ▼
            Retrieve Relevant Chunks
                      │
                      ▼
             Build Context Prompt
                      │
                      ▼
               Google Gemini LLM
                      │
                      ▼
                Generated Answer
```

---

## DocuMind Platform

Hosted demo where recruiters can upload PDFs and ask questions with cited, streaming answers in under 60 seconds.

**Try it:** [https://trydocumind.vercel.app/demo](https://trydocumind.vercel.app/demo)

**Shipped features (v1 + v2):**

- Multi-PDF upload per session + optional document filter
- Streaming answers (SSE: status → citations → tokens)
- Source citations with page/filename metadata
- Multi-turn context (last 4 messages + re-retrieve)
- Chat history in `localStorage` (7 days)
- Hybrid API key (server default; user brings own key on rate limit)
- Deployed: [Vercel frontend](https://trydocumind.vercel.app) + [Render backend](https://documind-api-e32e.onrender.com)

**Documentation — read these to understand or resume work:**


| Document                                                                                                     | What's inside                             |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| [docs/requirements.md](docs/requirements.md)                                                                 | Scope, API contract, roadmap              |
| [docs/architecture.md](docs/architecture.md)                                                                 | System design, data flows, deployment     |
| [docs/implementation-plan.md](docs/implementation-plan.md)                                                   | Step-by-step build checklist              |
| [docs/learning-notes.md](docs/learning-notes.md)                                                             | RAG concepts explained                    |
| [docs/superpowers/specs/2026-07-09-documind-design.md](docs/superpowers/specs/2026-07-09-documind-design.md) | Original v1 design spec                   |
| [docs/superpowers/specs/2026-07-11-documind-v2-design.md](docs/superpowers/specs/2026-07-11-documind-v2-design.md) | Multi-PDF + history design            |
| [docs/superpowers/specs/2026-07-11-documind-streaming-design.md](docs/superpowers/specs/2026-07-11-documind-streaming-design.md) | SSE streaming design     |


---

## Roadmap

### v1 — DocuMind Demo (shipped)

- [x] CLI RAG learning project
- [x] Monorepo restructure (`packages/`, `apps/`, `cli/`)
- [x] Platform documentation (requirements, architecture, implementation plan)
- [x] rag-core: PDF loader, in-memory sessions, citations
- [x] FastAPI backend (`apps/api`)
- [x] Next.js frontend (`apps/web`)
- [x] Deploy API on Render — [documind-api-e32e.onrender.com](https://documind-api-e32e.onrender.com)
- [x] Deploy frontend on Vercel — [trydocumind.vercel.app](https://trydocumind.vercel.app)

### v2 — Session History (shipped)

- [x] Chat history in browser (localStorage, 7 days)
- [x] Multiple PDFs per session + optional document filter
- [x] Multi-turn context (last 4 messages + retrieve)
- [x] Streaming answers (SSE status + citations + tokens)
- [x] Persistent sessions via Backblaze B2 (PDF + meta; lazy re-index on miss)

### v3 — User Accounts (in progress)

- [x] Clerk authentication
- [x] Saved projects and document libraries (Neon + B2)
- [x] Invite-link sharing (viewer/editor)
- [ ] Deploy Clerk + Neon env on Vercel/Render

---

## Configuration


| Setting              | Value                                    | Location                                      |
| -------------------- | ---------------------------------------- | --------------------------------------------- |
| Embedding model      | `sentence-transformers/all-MiniLM-L6-v2` | `packages/rag-core/src/rag_core/config.py`    |
| LLM model            | `gemini-2.5-flash`                       | `packages/rag-core/src/rag_core/config.py`    |
| LLM temperature      | `0.3`                                    | `packages/rag-core/src/rag_core/llm.py`       |
| Chunk size / overlap | `1000` / `200`                           | `packages/rag-core/src/rag_core/config.py`    |
| Retriever            | MMR, k=3, fetch_k=10                     | `packages/rag-core/src/rag_core/retriever.py` |
| CLI data directory   | `cli/data/`                              | `cli/config.py`                               |
| CLI vector DB        | `cli/chroma_db/`                         | `cli/config.py`                               |


---

## Technologies


| Technology            | Purpose                                          |
| --------------------- | ------------------------------------------------ |
| Python 3.11           | Core language                                    |
| LangChain             | Document loading, splitting, retrieval utilities |
| Sentence Transformers | Embedding generation (`all-MiniLM-L6-v2`)        |
| ChromaDB              | Vector database                                  |
| Google Gemini         | LLM (`gemini-2.5-flash`)                         |
| FastAPI               | Backend API (Render)                             |
| Next.js               | Frontend (Vercel)                                |
| Backblaze B2          | S3-compatible PDF/session persistence            |
| Clerk                 | Auth (sign-in / projects)                        |
| Neon Postgres         | Users, projects, memberships, invites            |


---

## Learning Experiments

Standalone scripts to explore RAG concepts:

```bash
python packages/rag-core/experiments/embedding_similarity.py
python packages/rag-core/experiments/chunk_analysis.py
```

---

## Example CLI Session

```
Ask a question (type 'exit' to quit): What is the mobile phone policy?

Answer:

The Mobile Phone Policy sets forth the standards and expectations governing
the appropriate and responsible usage of mobile devices...
```

---

## What Makes This Different

Built as a **learning project first**, designed like a **production system**:

- **No RetrievalQA shortcut** — every RAG step is explicit
- **Modular monorepo** — shared `rag-core`, separate CLI and web apps
- **RecursiveCharacterTextSplitter** — better chunks than character splitting
- **MMR retrieval** — diverse results, less redundancy
- **Grounded prompts** — answers only from context; refuses when unknown
- **Documented evolution** — CLI → API → web UI, with full specs in `docs/`

---

## Key Takeaways

- How RAG works internally (retrieve → prompt → generate)
- Why embeddings enable semantic search
- How chunking quality affects answer accuracy
- How to structure a GenAI app as a monorepo
- How to evolve a learning project into a deployable platform

---

## License

This project is licensed under the [MIT License](LICENSE).