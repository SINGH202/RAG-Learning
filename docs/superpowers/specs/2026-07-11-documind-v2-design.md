# DocuMind v2 — Session History + Multi-PDF Design

> **Date:** 2026-07-11  
> **Status:** Approved — implemented (see README roadmap for live status)  
> Keep this file as the historical v2 design; architecture.md is the living overview.

---

## Goals

1. Upload **multiple PDFs** into one API session
2. Ask with optional **document filter** (all docs by default, or one PDF)
3. Persist chat in **localStorage for 7 days**
4. Send **last 4 messages** with each ask; always **re-retrieve** from PDFs

## Non-goals (this phase)

- Disk-persistent vector store across API restarts
- Auth / saved projects (v3)
- Server-side message store as source of truth

---

## API changes

### Existing (compatible)

`POST /api/v1/sessions` — upload first PDF → create session  
Response adds `documents: [{ document_id, filename, chunk_count }]`

### New

`POST /api/v1/sessions/{id}/documents` — add another PDF  
`GET /api/v1/sessions/{id}/documents` — list documents in session

### Ask

```json
POST /api/v1/sessions/{id}/ask
{
  "question": "...",
  "document_id": null,
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

- `document_id` optional — filter Chroma metadata when set
- `history` optional — last ≤4 messages (excluding current question)
- Citations include `source` (filename) and `document_id`

---

## Data model

Session (in-memory):

- `session_id`, `vector_store`, `documents[]`, timestamps
- Each chunk metadata: `document_id`, `source`, `page`

Frontend localStorage key `documind.v2`:

```json
{
  "expiresAt": 1234567890,
  "sessionId": "...",
  "documents": [{ "document_id", "filename", "chunk_count" }],
  "messages": [{ "id", "role", "content", "citations?" }],
  "documentFilter": null
}
```

TTL: 7 days. On API 404 (session expired), clear `sessionId` / documents; keep messages with a re-upload prompt.

---

## UI

- Sidebar: upload more PDFs; list of documents
- Filter select: “All documents” | per-file
- Chat restores from localStorage on load
- Clear chat / new session control

---

## Trade-off

Vector index still dies on Render restart. Chat may remain in browser; user re-uploads PDFs to continue asking.
