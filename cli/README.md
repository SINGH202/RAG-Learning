# CLI

Original RAG learning project — interactive Q&A loop with sample company policy document.

## Run

From repo root:

```bash
source venv/bin/activate
python cli/main.py
```

Or install rag-core first (recommended):

```bash
pip install -e packages/rag-core
python cli/main.py
```

## Test LLM

```bash
python cli/test_llm.py
```

## Data

- Sample document: `cli/data/companyPolicies.txt`
- Vector DB (generated): `cli/chroma_db/` (gitignored)
