# DocuMind — Persistent Sessions via Backblaze B2 (Re-index)

> **Date:** 2026-07-11  
> **Status:** Implemented  
> **Approach:** A1 — store PDFs + metadata in S3-compatible object storage; lazy re-embed into in-memory Chroma on miss  
> **Provider:** Backblaze B2 (S3-compatible API)  
> **Constraint:** Stay free (no Render persistent disk)

---

## Goals

1. Survive Render restarts / free-tier sleep without forcing re-upload when `session_id` is still valid  
2. Keep today’s in-memory Chroma while the process is warm (fast path)  
3. Use Backblaze B2 for durable PDF + session metadata  
4. Preserve existing API shapes (`session_id`, documents, ask/stream)

## Non-goals

- Persisting Chroma files themselves  
- Eager re-index of all sessions on boot  
- Auth / per-user libraries (v3)

---

## Object layout (B2 bucket)

```
sessions/{session_id}/meta.json
sessions/{session_id}/docs/{document_id}.pdf
```

### `meta.json`

```json
{
  "session_id": "uuid",
  "created_at": "ISO-8601",
  "last_active": "ISO-8601",
  "documents": [
    {
      "document_id": "uuid",
      "filename": "handbook.pdf",
      "chunk_count": 42
    }
  ]
}
```

TTL uses `last_active` (default 30 minutes), same as in-memory sessions.

---

## Runtime flows

### Upload (create session)

1. Index PDF into ephemeral Chroma (unchanged)  
2. Put `docs/{document_id}.pdf` to B2  
3. Write `meta.json`  
4. Return session response as today  

If B2 is not configured → skip steps 2–3 (dev/local fallback).

### Add document

1. Append to in-memory store  
2. Put new PDF to B2  
3. Update `meta.json` (`documents` + `last_active`)

### Ask / stream / list / add when session missing from RAM

1. `GET meta.json` from B2  
2. If missing → 404  
3. If past TTL → delete session prefix → 404  
4. Else download PDFs → re-chunk/re-embed → register in `SessionManager`  
5. Touch `last_active` (memory + `meta.json`)  
6. Continue handler  

### TTL cleanup

- Delete in-memory session  
- Best-effort delete B2 prefix `sessions/{session_id}/`

---

## Configuration

Render / `.env` (S3-compatible — works for B2; R2 later if desired):

```
S3_ENDPOINT_URL=https://s3.<region>.backblazeb2.com
S3_REGION=<region>                 # e.g. us-west-004
S3_ACCESS_KEY_ID=<keyID>
S3_SECRET_ACCESS_KEY=<applicationKey>
S3_BUCKET_NAME=<bucket-name>
```

Optional:

```
S3_ENABLED=true   # default: true when credentials + endpoint + bucket present
```

Use `boto3` with `endpoint_url=S3_ENDPOINT_URL`.

### Backblaze setup (operator)

1. Create a B2 bucket (private)  
2. Create an **Application Key** with read/write on that bucket  
3. Note the S3 endpoint for your region (B2 UI shows it)  
4. Set the env vars on Render and redeploy the API  

---

## Code changes

| Area | Change |
|------|--------|
| `apps/api/config.py` | S3/B2 settings |
| `apps/api/services/object_storage.py` | put/get/delete via boto3 |
| `apps/api/services/session_restore.py` | meta+pdfs → rebuild vector store |
| `pdf_service` / routes | persist after index; `get_or_restore` before ask/add |
| `requirements.txt` | `boto3` |
| Docs / `.env.example` | B2 setup |

Frontend: no API contract change.

---

## Error handling

| Case | Behavior |
|------|----------|
| S3 unset | In-memory only |
| S3 enabled + put fails on upload | Fail request (fail closed) |
| Get fails on restore | 404 / 503 clear message |
| Partial PDF list | Fail restore; don’t register half session |

---

## Test plan

- [ ] Without S3: upload + ask works  
- [ ] With B2: upload writes meta + PDF  
- [ ] Restart API → same `session_id` restores and answers  
- [ ] Past TTL → prefix deleted; ask 404  
- [ ] Multi-PDF + stream restore  

---

## Implementation order

1. Config + `object_storage` helpers  
2. Persist on create/add  
3. `get_or_restore` in routes  
4. TTL deletes B2 prefix  
5. Docs / `.env.example`
