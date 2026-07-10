# DocuMind — Streaming Answers Design

> **Date:** 2026-07-11  
> **Status:** Approved — implemented  
> **Scope:** SSE streaming for ask (status + citations + tokens)  
> **Follows:** Approach 1 — event pipeline in `rag-core`

---

## Goals

1. Demo shows **retrieving → generating** status, then **citation cards**, then **token-by-token** answer text
2. Transport: **Server-Sent Events** (`text/event-stream`)
3. Keep existing **`POST /ask`** (JSON) for curl/scripts; demo uses **`POST /ask/stream`**
4. Same session rules as today: hybrid API key, rate limit, TTL, `document_id`, last-4 `history`

## Non-goals

- CLI streaming
- Mid-generation citation updates
- Persistent vector store (phase A) / auth (phase C)

---

## Event contract

`POST /api/v1/sessions/{session_id}/ask/stream`

**Request body** (same as `/ask`):

```json
{
  "question": "...",
  "document_id": null,
  "history": [{ "role": "user", "content": "..." }]
}
```

**Response:** `Content-Type: text/event-stream`

Each event:

```
data: {"type":"...","...":...}\n\n
```

| `type` | When | Fields |
|--------|------|--------|
| `status` | Phase change | `phase`: `"retrieving"` \| `"generating"` |
| `citations` | After vector retrieve, before LLM | `citations`: array (same shape as `AskResponse.citations`) |
| `token` | Each LLM chunk | `text`: string delta |
| `done` | Success | `session_id`: string |
| `error` | Failure | `message`: string; optional `use_own_key`: bool |

**Ordering (happy path):**

1. `status` (`retrieving`)
2. `citations`
3. `status` (`generating`)
4. zero or more `token`
5. `done`

On failure after start: emit `error` and close (may omit `done`).

Citations are **complete after retrieval** — not partial guesses during generation. “Citation previews” means the UI can show source cards immediately while tokens still stream.

---

## Backend

### `rag-core`

Add async generator:

```python
async def ask_with_scores_stream(
    question, vector_store, llm, *, k=3, document_id=None, history=None
) -> AsyncIterator[dict]:
    ...
```

- Yield `status` / `citations` / `token` / `done` dicts (caller adds SSE framing)
- Reuse existing prompt builder + citation mapping from `ask_with_scores`
- Use `llm.astream(prompt)` for tokens
- Sync retrieve is fine inside the async generator (offload to thread if needed later)

### API

- New route: `POST /sessions/{session_id}/ask/stream` → `StreamingResponse`
- Reuse session lookup, rate limit, key resolution, `document_id` validation from `/ask`
- Map generator exceptions to an `error` event (429 → `use_own_key: true` when appropriate)
- Touch session TTL on successful stream start or on `done`

### Compatibility

- `POST /ask` unchanged (non-streaming JSON)

---

## Frontend

- `askQuestionStream(...)` in `lib/api.ts` using `fetch` + `ReadableStream` / SSE line parser
- `DemoWorkspace` / `ChatPanel`:
  - Append assistant placeholder on ask
  - Show phase status (“Retrieving…” / “Generating…”)
  - Attach citations when `citations` arrives
  - Append `token.text` to assistant content
  - Finalize on `done`; surface `error` like today’s ask errors
- `AbortController`: cancel previous stream on new ask or unmount
- Keep localStorage persistence of final messages (not mid-stream tokens only — save after `done` / on each token is OK if already saving on message state updates)

---

## Error & edge cases

| Case | Behavior |
|------|----------|
| Session missing/expired | HTTP 404 before stream (same as `/ask`) |
| Rate limit / Gemini quota | Prefer HTTP 429 when known before stream; else `error` event with `use_own_key` |
| Client abort | Stop consuming generator; no crash |
| Empty retrieval | Still stream; model may reply “I don’t know…” |

---

## Test plan

- [ ] curl SSE: see `status` → `citations` → `token` → `done`
- [ ] Demo: citations appear before/during answer typing
- [ ] Abort: start ask, navigate away / ask again — no duplicate bubbles
- [ ] Non-stream `/ask` still returns full JSON
- [ ] Rate-limit path still opens API key UI

---

## Implementation order

1. `ask_with_scores_stream` in `rag-core`
2. FastAPI `/ask/stream` SSE route
3. Web client + ChatPanel/DemoWorkspace wiring
4. README / API docs curl example
