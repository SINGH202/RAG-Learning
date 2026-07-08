# DocuMind — RAG Learning → Production Platform

A **Retrieval-Augmented Generation (RAG)** project built from scratch, evolving from a CLI learning tool into a hosted **PDF Q&A web platform** for portfolio and hiring visibility.


|                      |                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------- |
| **What works today** | CLI app — upload a document, ask questions, get Gemini-powered answers                  |
| **What's next**      | DocuMind web demo — PDF upload, cited answers, deploy on Vercel + Render                |
| **Why it exists**    | Learn RAG internals (no `RetrievalQA` black box) and showcase full-stack + GenAI skills |


**Stack:** LangChain · Sentence Transformers · ChromaDB · Google Gemini · FastAPI (planned) · Next.js (planned)

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
│   ├── api/                     # 🚧 Planned — FastAPI backend (Render)
│   └── web/                     # 🚧 Planned — Next.js frontend (Vercel)
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
| `**apps/api/**`          | REST API for PDF upload + Q&A (not built yet)            |
| `**apps/web/**`          | Portfolio site + demo UI (not built yet)                 |
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

## DocuMind Platform (In Progress)

The CLI is being extended into **DocuMind** — a hosted demo where recruiters can upload a PDF and ask questions with cited answers in under 60 seconds.

**Planned features (v1):**

- PDF upload via web UI
- Answers with source citations
- Hybrid API key (server default; user brings own key on rate limit)
- Deploy: Vercel (frontend) + Render (backend)

**Documentation — read these to understand or resume work:**


| Document                                                                                                     | What's inside                             |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| [docs/requirements.md](docs/requirements.md)                                                                 | Full v1 scope, API contract, future v2/v3 |
| [docs/architecture.md](docs/architecture.md)                                                                 | System design, data flows, deployment     |
| [docs/implementation-plan.md](docs/implementation-plan.md)                                                   | Step-by-step build checklist              |
| [docs/learning-notes.md](docs/learning-notes.md)                                                             | RAG concepts explained                    |
| [docs/superpowers/specs/2026-07-09-documind-design.md](docs/superpowers/specs/2026-07-09-documind-design.md) | Approved design spec                      |


---

## Roadmap

### v1 — DocuMind Demo (in progress)

- [x] CLI RAG learning project
- [x] Monorepo restructure (`packages/`, `apps/`, `cli/`)
- [x] Platform documentation (requirements, architecture, implementation plan)
- [ ] rag-core: PDF loader, in-memory sessions, citations
- [ ] FastAPI backend (`apps/api`)
- [ ] Next.js frontend (`apps/web`)
- [ ] Deploy on Vercel + Render

### v2 — Session History (planned)

- [ ] Chat history per uploaded PDF
- [ ] Persistent vector store
- [ ] Multiple PDFs per session

### v3 — User Accounts (planned)

- [ ] Authentication
- [ ] Saved projects and document libraries
- [ ] Shared workspaces

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
| FastAPI               | Backend API (planned)                            |
| Next.js               | Frontend (planned)                               |


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
- rWhy embeddings enable semantic search
- How chunking quality affects answer accuracy
- How to structure a GenAI app as a monorepo
- How to evolve a learning project into a deployable platform

---

## License

MIT License