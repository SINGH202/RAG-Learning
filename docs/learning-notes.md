# RAG Learning — Notes

> Distilled from the original learning journey. Supersedes `what&why.md`.

---

## What is RAG?

Retrieval-Augmented Generation combines **search** with **generation**:

```
User question
    → Embed question
    → Search vector DB for similar chunks
    → Build prompt with retrieved context
    → Send to LLM
    → Grounded answer
```

Without RAG, the LLM only knows its training data. With RAG, it answers from **your documents**.

---

## Key Components

### 1. Document Loading

LangChain `TextLoader` (CLI) / `pypdf` (platform) converts files into `Document` objects:

- `page_content` — raw text
- `metadata` — source, page number

### 2. Text Chunking

`RecursiveCharacterTextSplitter` splits on paragraph/sentence boundaries:

- **Chunk size:** 1000 characters
- **Overlap:** 200 characters (prevents context loss at boundaries)

Better than `CharacterTextSplitter` because it respects semantic boundaries.

### 3. Embeddings

Text → 384-dimensional vectors via `sentence-transformers/all-MiniLM-L6-v2`:

```
"I love programming" → [0.12, -0.44, 0.87, ...]
```

Similar meaning → similar vectors → findable by semantic search.

### 4. Vector Database

ChromaDB stores embeddings for fast similarity search:

- **CLI:** persistent on disk (`chroma_db/`)
- **Platform v1:** in-memory per session (TTL 30 min)
- **Platform v2 (planned):** persistent across sessions

### 5. Retriever

MMR (Maximal Marginal Relevance) retrieval:

- **k=3:** return 3 chunks
- **fetch_k=10:** consider 10 candidates, pick 3 diverse ones

Reduces duplicate chunks vs simple similarity search.

### 6. Prompt Engineering

Grounded prompt pattern (from `rag.py`):

```
Answer ONLY using the context below.
If not found, say "I don't know based on the provided document."

Context: <retrieved chunks>
Question: <user question>
```

### 7. LLM

Google Gemini `gemini-2.5-flash` (temperature=0.3):

- Started with Ollama (local) during learning
- Swapped to Gemini for cloud deployment
- LLM integration is pluggable — swap provider without changing RAG pipeline

---

## Why Build RAG Manually?

Instead of `RetrievalQA.from_chain_type(...)`, every step is explicit:

```
Retriever → Retrieve → Build Context → Prompt → LLM → Answer
```

This reveals what frameworks hide and builds real understanding.

---

## Tech Choices & Rationale

| Choice | Why |
|--------|-----|
| LangChain | Orchestration utilities; not a black box |
| ChromaDB | Local, free, persistent option for CLI |
| Sentence Transformers | Fast, good quality, runs locally |
| Gemini | Free tier, fast, good for demos |
| RecursiveCharacterTextSplitter | Better semantic chunks |
| MMR retrieval | Diverse results, less redundancy |

---

## Evolution: CLI → Platform

| Aspect | CLI (current) | Platform v1 | Platform v2+ |
|--------|--------------|-------------|--------------|
| Input | Pre-loaded text file | User-uploaded PDF | Multiple PDFs |
| Vector store | Disk (persistent) | In-memory (session) | Persistent DB |
| Interface | Terminal | Web UI | Web + auth |
| API key | `.env` file | Hybrid server/user | Per-user keys |
| Hosting | Local | Vercel + Render | Same + DB |

---

## Useful Commands

```bash
# Run CLI
cd cli && python main.py

# Test LLM connection
cd cli && python test_llm.py

# Run experiments
python packages/rag-core/experiments/embedding_similarity.py
python packages/rag-core/experiments/chunk_analysis.py
```

---

## References

- [IBM RAG Course](https://www.ibm.com/training/course/building-generative-ai-powered-applications-with-python-w-coursera-) — original learning source
- [Google AI Studio](https://aistudio.google.com/apikey) — Gemini API key
- [LangChain Docs](https://python.langchain.com/)
- [ChromaDB Docs](https://docs.trychroma.com/)
