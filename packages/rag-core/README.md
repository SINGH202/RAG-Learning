# rag-core

Shared RAG pipeline library used by the CLI and FastAPI backend.

## Modules

- `loader` — document loading
- `splitter` — text chunking
- `vector_store` — ChromaDB create/load
- `retriever` — MMR semantic search
- `llm` — Google Gemini integration
- `rag` — manual RAG pipeline (retrieve → prompt → answer)

## Install (editable)

```bash
pip install -e packages/rag-core
```
