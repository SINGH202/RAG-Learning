# DocuMind Web

Next.js frontend for the DocuMind PDF Q&A demo.

**Features:** multi-PDF sessions, SSE streaming answers, citation cards, 7-day `localStorage` chat history, hybrid API key toggle.

## Run locally

```bash
cd apps/web
cp .env.local.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) · demo at `/demo`.

## Environment

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend base URL (no trailing slash) |

Default production API: `https://documind-api-e32e.onrender.com`

## Deploy (Vercel)

1. Import the GitHub repo
2. Set **Root Directory** to `apps/web`
3. Framework: **Next.js**
4. Set env: `NEXT_PUBLIC_API_URL=https://documind-api-e32e.onrender.com`
5. Deploy

Also update Render `CORS_ORIGINS` to include your Vercel URL (and allow `*.vercel.app` previews if configured).
