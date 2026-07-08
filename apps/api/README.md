# DocuMind API

FastAPI backend for PDF upload and RAG Q&A.

## Run locally (uvicorn)

```bash
# from repo root
source venv/bin/activate
pip install -r requirements.txt
pip install -r apps/api/requirements.txt
pip install -e packages/rag-core

cd apps/api
uvicorn main:app --reload --port 8000
```

## Run locally (Docker — same as Render)

```bash
# from repo root
docker build -f apps/api/Dockerfile -t documind-api .
docker run --rm -p 8000:8000 --env-file .env documind-api
```

## Render settings

| Setting | Value |
|---------|--------|
| Runtime | Docker |
| Dockerfile Path | `apps/api/Dockerfile` |
| Docker Build Context | `.` (repo root) |

## Environment variables

```
GOOGLE_API_KEY=...
CORS_ORIGINS=http://localhost:3000
SESSION_TTL_MINUTES=30
RATE_LIMIT_PER_HOUR=20
MAX_PDF_SIZE_MB=10
```

## Test

```bash
curl http://localhost:8000/api/v1/health

curl -X POST http://localhost:8000/api/v1/sessions \
  -F "file=@/path/to/sample.pdf"

curl -X POST http://localhost:8000/api/v1/sessions/{SESSION_ID}/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is this document about?"}'
```
