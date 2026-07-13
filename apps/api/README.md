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

| Setting              | Value                 |
| -------------------- | --------------------- |
| Runtime              | Docker                |
| Dockerfile Path      | `apps/api/Dockerfile` |
| Docker Build Context | `.` (repo root)       |

## Environment variables

```
GOOGLE_API_KEY=...
CORS_ORIGINS=http://localhost:3000
SESSION_TTL_MINUTES=30
RATE_LIMIT_PER_HOUR=20
MAX_PDF_SIZE_MB=10

# Optional — Backblaze B2 (S3-compatible). When set, sessions survive API restarts.
S3_ENDPOINT_URL=https://s3.<region>.backblazeb2.com
S3_REGION=<region>
S3_ACCESS_KEY_ID=<keyID>
S3_SECRET_ACCESS_KEY=<applicationKey>
S3_BUCKET_NAME=<bucket-name>

# Auth v3 — Neon + Clerk
DATABASE_URL=postgresql://...
CLERK_JWKS_URL=https://<frontend-api>/.well-known/jwks.json
NEXT_PUBLIC_CLERK_SECRET_KEY=sk_test_...
INVITE_EXPIRY_DAYS=7
```

## Test

```bash
curl http://localhost:8000/api/v1/health

# Create session with first PDF
curl -X POST http://localhost:8000/api/v1/sessions \
  -F "file=@/path/to/sample.pdf"

# Add another PDF to the same session
curl -X POST http://localhost:8000/api/v1/sessions/{SESSION_ID}/documents \
  -F "file=@/path/to/other.pdf"

# List documents
curl http://localhost:8000/api/v1/sessions/{SESSION_ID}/documents

# Ask (optional document_id + last-4 history)
curl -X POST http://localhost:8000/api/v1/sessions/{SESSION_ID}/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is this document about?",
    "document_id": null,
    "history": [
      {"role": "user", "content": "Summarize the intro"},
      {"role": "assistant", "content": "It covers company policy."}
    ]
  }'

# Ask with SSE streaming (status → citations → tokens → done)
curl -N -X POST http://localhost:8000/api/v1/sessions/{SESSION_ID}/ask/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"question": "What is this document about?"}'
```
