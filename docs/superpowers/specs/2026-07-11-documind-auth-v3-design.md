# DocuMind — Auth v3 (Clerk + Neon + Projects)

> **Date:** 2026-07-11  
> **Status:** Approved for implementation  
> **Auth:** Clerk  
> **DB:** Neon Postgres  
> **Storage:** Backblaze B2 (existing bucket)

---

## Goals

1. Signed-in users can create durable **projects** with PDF libraries  
2. Invite-link sharing (`owner` / `editor` / `viewer`)  
3. Keep anonymous `/demo` working with a **soft gate** after first upload  
4. Do not break existing `/api/v1/sessions/*` guest flow  

## Non-goals (this pass)

- Email invites, billing  
- Migrating guest session PDFs into a project  
- Persisting chat messages in Neon  
- Replacing guest sessions API  

---

## Architecture

- **Guest:** `/api/v1/sessions/*` + B2 `sessions/{id}/…` + TTL  
- **Signed-in:** `/api/v1/projects/*` + Neon metadata + B2 `projects/{id}/docs/…`  
- Next.js uses Clerk; FastAPI verifies `Authorization: Bearer <Clerk JWT>` via JWKS  

## Data model

| Table | Purpose |
|-------|---------|
| `users` | Clerk user id, email, name |
| `projects` | name, owner |
| `project_members` | role: owner \| editor \| viewer |
| `documents` | filename, b2_key, chunk_count |
| `project_invites` | token, role, expiry, revoked |

## Soft gate

After the first successful guest PDF upload on `/demo`, show a modal: Sign in to save / Continue as guest.

## Defaults

- Invite default role: **viewer**  
- Invite expiry: **7 days**  
- Chat history: **localStorage** (signed-in and guest)  
