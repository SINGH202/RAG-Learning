# DocuMind API

FastAPI backend for PDF upload and RAG Q&A.

## Run locally

From repo root:

```bash
source venv/bin/activate
pip install -r requirements.txt
pip install -r apps/api/requirements.txt
pip install -e packages/rag-core

cd apps/api
uvicorn main:app --reload --port 8000
```

Set env in repo root `.env`:

```env
GOOGLE_API_KEY=your_key_here
CORS_ORIGINS=http://localhost:3000
```

## Endpoints

- `GET /api/v1/health`
- `POST /api/v1/sessions` — multipart PDF upload
- `POST /api/v1/sessions/{id}/ask` — JSON `{ "question": "..." }`
- `DELETE /api/v1/sessions/{id}`

Optional header: `X-User-Api-Key` for user-provided Gemini key.

## Test

```bash
curl http://localhost:8000/api/v1/health

curl -X POST http://localhost:8000/api/v1/sessions \
  -F "file=@/path/to/sample.pdf"

curl -X POST http://localhost:8000/api/v1/sessions/{SESSION_ID}/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is this document about?"}'
```
