# 📚 RAG Learning Project (From Scratch)

A Retrieval-Augmented Generation (RAG) application built from scratch using **LangChain**, **Sentence Transformers**, **ChromaDB**, and **Google Gemini**.

The goal of this project was **not** to simply use LangChain's `RetrievalQA`, but to understand how every component of a RAG system works internally by building each layer step-by-step.

---

## 🚀 Features

- ⬇️ Auto-download sample company policy document
- 📄 Load documents using LangChain `TextLoader`
- ✂️ Split documents into semantic chunks with `RecursiveCharacterTextSplitter`
- 🧠 Generate embeddings using Sentence Transformers (`all-MiniLM-L6-v2`)
- 🗄️ Store vectors in ChromaDB with persistent local storage
- 🔍 Perform semantic search with MMR-based Retriever
- 🤖 Generate answers using Google Gemini (`gemini-2.5-flash`)
- 💬 Interactive question-answer CLI loop
- 🏗️ Modular project architecture
- 🧪 Learning experiments for chunking and embedding similarity

---

## Project Architecture

```
                User Question
                      │
                      ▼
                Retriever (MMR)
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

## Complete Pipeline

```
IBM Sample Document (URL)
      │
      ▼
download_document.py
      │
      ▼
LangChain TextLoader
      │
      ▼
Document Object
      │
      ▼
RecursiveCharacterTextSplitter
      │
      ▼
Document Chunks
      │
      ▼
HuggingFaceEmbeddings (Sentence Transformers)
      │
      ▼
Embeddings (384-dim vectors)
      │
      ▼
ChromaDB (persisted in chroma_db/)
      │
      ▼
Retriever (MMR, k=3)
      │
      ▼
Prompt Builder (rag.py)
      │
      ▼
Gemini 2.5 Flash
      │
      ▼
Answer
```

---

## Project Structure

```
RAG-Learning/
│
├── docs/                            # Requirements, architecture, implementation plan
│   ├── requirements.md
│   ├── architecture.md
│   ├── implementation-plan.md
│   └── learning-notes.md
│
├── packages/rag-core/               # Shared RAG library
│   ├── src/rag_core/
│   │   ├── config.py
│   │   ├── loader.py
│   │   ├── splitter.py
│   │   ├── vector_store.py
│   │   ├── retriever.py
│   │   ├── llm.py
│   │   └── rag.py
│   └── experiments/
│
├── apps/
│   ├── api/                         # FastAPI backend (Render) — Phase 2
│   └── web/                         # Next.js frontend (Vercel) — Phase 3
│
├── cli/                             # Original learning CLI
│   ├── main.py
│   ├── data/companyPolicies.txt
│   └── chroma_db/                   # Generated (gitignored)
│
├── requirements.txt
├── .env.example
└── README.md
```

---

## Technologies Used

| Technology | Purpose |
|------------|---------|
| Python | Programming language |
| LangChain | Document processing and RAG utilities |
| langchain-community | `TextLoader` for document loading |
| langchain-chroma | ChromaDB vector store integration |
| langchain-huggingface | HuggingFace embedding wrapper |
| langchain-google-genai | Google Gemini LLM integration |
| Sentence Transformers | Embedding generation |
| ChromaDB | Vector database with local persistence |
| Google Gemini | Large language model (`gemini-2.5-flash`) |
| HuggingFace | Embedding model hosting |
| python-dotenv | Environment variable management |
| wget | Sample document download |

---

## What We Learned

### 1. Document Loading

Instead of reading text files manually, we used LangChain's `TextLoader`.

```
Text File
      ↓
LangChain Document
```

Each document contains:

- `page_content` — the raw text
- `metadata` — source file information

The sample document is automatically downloaded from the IBM course URL on first run if it does not already exist in `data/`.

---

### 2. Text Chunking

Instead of using:

```
CharacterTextSplitter
```

we used:

```
RecursiveCharacterTextSplitter
```

because it preserves paragraph boundaries and creates better semantic chunks.

Configuration (from `src/config.py`):

- **Chunk Size:** 1000
- **Chunk Overlap:** 200

---

### 3. Embeddings

We learned how text becomes vectors.

```
"I love programming"
      ↓
[0.12, -0.44, 0.87, ...]
```

Each chunk becomes a **384-dimensional** vector using:

```
sentence-transformers/all-MiniLM-L6-v2
```

In production code, embeddings are created via `HuggingFaceEmbeddings` in `vector_store.py`. The `experiments/` folder uses `SentenceTransformer` directly to explore how similarity works under the hood.

---

### 4. Vector Database

Generated embeddings are stored in ChromaDB.

Benefits:

- Fast semantic search
- Persistent storage across runs
- Local database — no external service required

The database is stored inside:

```
chroma_db/
```

On startup, `main.py` checks whether the database already exists. If it does, embeddings are loaded instantly — only the first run builds the index.

---

### 5. Retriever

Instead of searching with keywords, we perform **semantic search**.

We used:

```python
search_type="mmr"
```

instead of simple similarity search to reduce duplicate results and improve chunk diversity.

Retriever settings:

- **k:** 3 (documents returned)
- **fetch_k:** 10 (candidates considered before MMR selection)

---

### 6. Prompt Engineering

Instead of sending only the question to Gemini:

```
What is the mobile policy?
```

we send:

```
Context:
<Retrieved Chunks>

Question:
What is the mobile policy?
```

The prompt also instructs the model to reply with *"I don't know based on the provided document."* when the answer cannot be found in the context. This keeps responses grounded in the source material.

---

### 7. Building RAG Without RetrievalQA

Instead of using:

```python
RetrievalQA.from_chain_type(...)
```

we implemented every step manually in `src/rag.py`:

```
Retriever
      ↓
Retrieve Documents
      ↓
Build Context
      ↓
Create Prompt
      ↓
Gemini
      ↓
Answer
```

This helped us understand what LangChain does internally.

---

## Improvements Over the Original IBM Notebook

Instead of following the notebook exactly, several production-oriented improvements were introduced.

### ✅ Modular Project Structure

**Notebook:**

```
Everything in one file
```

**Project:**

```
config.py → loader.py → splitter.py → vector_store.py
         → retriever.py → llm.py → rag.py
```

---

### ✅ Persistent Chroma Database

Instead of recreating embeddings every run:

```
Application Start
      ↓
Load Existing Database (if chroma_db/ exists)
      ↓
Skip embedding — go straight to Q&A
```

Only the first execution creates embeddings.

---

### ✅ Auto-Download Sample Document

The `download_document()` function fetches the IBM sample policy file automatically, so the project works out of the box after setup.

---

### ✅ Modern LangChain APIs

Used the latest LangChain ecosystem:

- `langchain-community`
- `langchain-chroma`
- `langchain-huggingface`
- `langchain-google-genai`

instead of deprecated imports.

---

### ✅ Better Chunking

Used:

```
RecursiveCharacterTextSplitter
```

instead of:

```
CharacterTextSplitter
```

---

### ✅ Better Retrieval

Used:

```
MMR Retrieval
```

instead of:

```
Similarity Retrieval
```

to improve diversity of retrieved chunks.

---

### ✅ Interactive CLI

`main.py` runs a continuous Q&A loop — ask multiple questions without restarting the application. Type `exit` to quit.

---

## Running the Project

### Prerequisites

- Python 3.11+
- A [Google AI API key](https://aistudio.google.com/apikey) for Gemini

### Clone

```bash
git clone <repository-url>
cd RAG-Learning
```

### Create Virtual Environment (recommended)

```bash
python -m venv venv
source venv/bin/activate   # macOS / Linux
# venv\Scripts\activate    # Windows
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configure Environment

Create a `.env` file in the project root:

```
GOOGLE_API_KEY=your_api_key_here
```

### Run

```bash
python cli/main.py
```

On first run, the app will:

1. Download the sample company policy document
2. Load and chunk the document
3. Generate embeddings and persist them to `chroma_db/`

On subsequent runs, it loads the existing vector database and starts the Q&A loop immediately.

### Test LLM Connection

```bash
python cli/test_llm.py
```

### Run Experiments

```bash
python packages/rag-core/experiments/embedding_similarity.py
python packages/rag-core/experiments/chunk_analysis.py
```

---

## Example

```
Ask a question (type 'exit' to quit): What is the mobile phone policy?

Answer:

The Mobile Phone Policy sets forth the standards and expectations governing
the appropriate and responsible usage of mobile devices...
```

---

## Configuration

All settings are centralized in `src/config.py`:

| Setting | Value |
|---------|-------|
| Embedding Model | `sentence-transformers/all-MiniLM-L6-v2` |
| LLM Model | `gemini-2.5-flash` |
| LLM Temperature | `0.3` |
| Chunk Size | `1000` |
| Chunk Overlap | `200` |
| Retriever k | `3` |
| Retriever fetch_k | `10` |
| Chroma Directory | `chroma_db/` |
| Data Directory | `data/` |

---

---

## DocuMind Platform (In Progress)

This CLI project is being extended into **DocuMind** — a hosted PDF Q&A web demo for portfolio and hiring visibility.

| Document | Description |
|----------|-------------|
| [docs/requirements.md](docs/requirements.md) | Full requirements (v1 + future v2/v3) |
| [docs/architecture.md](docs/architecture.md) | System design, data flows, tech stack |
| [docs/implementation-plan.md](docs/implementation-plan.md) | Phased build checklist — start here to resume work |
| [docs/learning-notes.md](docs/learning-notes.md) | RAG concepts and learning journey |
| [docs/superpowers/specs/2026-07-09-documind-design.md](docs/superpowers/specs/2026-07-09-documind-design.md) | Approved design spec |

**Target architecture:** Monorepo with `packages/rag-core`, `apps/api` (FastAPI/Render), `apps/web` (Next.js/Vercel), and `cli/` (this learning project preserved).

---

## Roadmap

### v1 — DocuMind Demo (in progress)
- [x] CLI RAG learning project (current)
- [ ] Monorepo restructure (`packages/`, `apps/`, `cli/`)
- [ ] Web UI: upload PDF, ask questions, cited answers
- [ ] Hybrid API key (server default + user override on rate limit)
- [ ] Deploy on Vercel + Render

### v2 — Session History (planned, not started)
- [ ] Chat history per uploaded PDF (same browser session)
- [ ] Persistent vector store (disk or managed DB)
- [ ] Multiple PDFs per session

### v3 — User Accounts (planned, not started)
- [ ] Authentication (Google OAuth / email)
- [ ] Saved projects and document libraries
- [ ] Multi-user shared workspaces

---

## Future Improvements (CLI / rag-core)

- Hybrid search (keyword + semantic)
- Re-ranking retrieved chunks
- Streaming responses
- Local LLM support (Ollama)
- LangGraph integration

---

## Key Takeaways

Through this project we learned:

- How Retrieval-Augmented Generation works internally
- Why embeddings are required for semantic search
- How vector databases perform similarity lookups
- How prompts are constructed to ground LLM responses
- Why chunking quality directly affects retrieval accuracy
- How modern RAG systems are architected in production
- How to build a modular AI application instead of a single notebook

---

## License

MIT License
