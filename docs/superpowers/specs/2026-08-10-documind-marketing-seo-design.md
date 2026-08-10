# DocuMind marketing & SEO polish (portfolio)

**Date:** 2026-08-10  
**Status:** Approved for planning  
**Surface:** `apps/web` (Next.js)  
**Goal:** Recruiter/portfolio conversion and crawlability — adapt a local-business checklist to DocuMind without fake local SEO.

---

## Decisions (locked)

| Choice | Decision |
|--------|----------|
| Primary goal | Recruiter / portfolio polish (not local business) |
| Hero “reactions” | Skip — keep brand, headline, support line, primary CTA |
| Inquiry flow | Recruiter contact form → `mailto:` → `/thank-you` |
| Maps / local Schema / customer reviews | Out of scope |
| Google Analytics | Out of scope for now |
| Architecture | Landing expansion + minimal new routes (Approach 1) |
| Search Console | HTML file verification already at `apps/web/public/google2fe32b83b8180183.html` |

---

## Scope map

### In scope

1. **Home landing expansion** (`apps/web/src/app/page.tsx`)
   - Strong above-the-fold hero (existing pattern): DocuMind brand, headline, one support sentence, primary CTA to live demo
   - Internal nav links (header + footer) to `#case-study`, `#faq`, `#contact`, plus `/demo`, `/privacy`, GitHub
   - **Case study** section (`#case-study`): CLI learning project → FastAPI API → Next.js demo with citations
   - **Five FAQs** (`#faq`): what it is, data retention / TTL, BYO Gemini key, stack, how to contact
   - **Response-time promise** near contact: “Usually reply within 2 business days”
   - **Recruiter contact** (`#contact`): name, email, message

2. **Sticky mobile CTA**
   - Component: fixed bottom bar, visible below `md`
   - Primary action: Open / Try demo → `/demo` (via existing `WakeDemoLink` if appropriate)
   - Hidden on `/demo` and `/thank-you`
   - Add bottom padding on pages where the bar shows so content is not covered

3. **Thank-you page** — `/thank-you`
   - Confirmation after inquiry submit
   - Links back to home and demo
   - Unique title + meta description
   - Breadcrumbs: Home › Thank you

4. **Privacy policy page** — `/privacy`
   - Short, accurate copy for a portfolio demo: temporary sessions, client-side history, no GA in this release, contact via email/GitHub
   - Unique title + meta description
   - Breadcrumbs: Home › Privacy

5. **Breadcrumbs**
   - Shared component used on `/demo`, `/privacy`, `/thank-you`
   - Not required on home

6. **robots.txt**
   - Prefer `apps/web/src/app/robots.ts`
   - Allow marketing routes: `/`, `/demo`, `/privacy`, `/thank-you`
   - Disallow: `/app`, `/app/*`, `/sign-in`, `/sign-up` (and invite if private)
   - Do not block the GSC verification HTML file
   - Reference `sitemap.xml` in the robots response

6b. **sitemap.xml**
   - Prefer `apps/web/src/app/sitemap.ts`
   - Include only routes that exist (start: `/`, `/demo`; add `/privacy`, `/thank-you` when those pages ship)
   - Use `NEXT_PUBLIC_SITE_URL` / production host as absolute URLs

7. **Unique page titles & meta descriptions**
   - Per-route `metadata` (or `generateMetadata`) on home, demo, privacy, thank-you
   - Root layout keeps sensible defaults; child routes override

8. **Social share images**
   - Keep existing `opengraph-image.tsx` / `twitter-image.tsx`
   - Ensure `alt` remains meaningful (already present on OG)

9. **Alt text**
   - Any new `<img>` / decorative media on marketing pages gets descriptive `alt` (or empty `alt` only if purely decorative)

10. **Optional product Schema (not LocalBusiness)**
    - JSON-LD `SoftwareApplication` (or `WebApplication`) on home describing DocuMind
    - Explicitly **not** `LocalBusiness` / geo markup

11. **Google Search Console verification**
    - Keep `public/google2fe32b83b8180183.html` content unchanged
    - Served at site root after deploy

### Out of scope

- Reactions / emoji ratings above the fold
- Maps, directions, LocalBusiness Schema
- Real or fabricated customer reviews
- Google Analytics / gtag
- Backend inquiry storage or Formspree
- New Typography system (project has no shared `<Typography />`; keep existing heading/paragraph + Tailwind)

---

## Components & files

| Piece | Path (planned) | Notes |
|-------|----------------|-------|
| Home sections | `apps/web/src/app/page.tsx` | Expand in place; extract section components only if file gets unwieldy |
| Sticky CTA | `apps/web/src/components/StickyMobileCta.tsx` | Client component |
| Breadcrumbs | `apps/web/src/components/Breadcrumbs.tsx` | Presentational |
| Contact form | `apps/web/src/components/RecruiterContactForm.tsx` | Client; `mailto` + navigate |
| Thank you | `apps/web/src/app/thank-you/page.tsx` | Static |
| Privacy | `apps/web/src/app/privacy/page.tsx` | Static |
| robots | `apps/web/src/app/robots.ts` | Next MetadataRoute |
| sitemap | `apps/web/src/app/sitemap.ts` | Next MetadataRoute; marketing URLs only |
| site URL helper | `apps/web/src/lib/site.ts` | Shared canonical origin |
| Header/footer links | `SiteHeader.tsx` + home footer | Anchor + route links |
| Contact email | `NEXT_PUBLIC_CONTACT_EMAIL` | Optional env; fallback to GitHub issues if unset |
| GSC file | `apps/web/public/google2fe32b83b8180183.html` | Already present |

Reuse existing visual language (Fraunces / Source Sans, teal/sand/ink/paper tokens, `SiteHeader`, `WakeDemoLink`). No new dependencies.

---

## Contact data flow

```
User fills name, email, message
  → HTML required + client validation
  → Build mailto:{CONTACT}?subject=...&body=...
  → Assign window.location.href to mailto (opens mail client)
  → router.push("/thank-you")
```

- No API call.
- If `NEXT_PUBLIC_CONTACT_EMAIL` is set it overrides the default; otherwise use `apk.anurag.singh@gmail.com`.
- Phone shown on contact / thank-you: `88749 40467` (`tel:+918874940467`).
- Response-time promise copy sits adjacent to the form (not a separate system).

---

## SEO details

| Route | Title intent | Description intent |
|-------|--------------|--------------------|
| `/` | DocuMind — PDF Q&A with RAG | Upload PDFs, ask grounded questions with citations… |
| `/demo` | Try DocuMind demo | Live PDF Q&A session… |
| `/privacy` | Privacy — DocuMind | How demo data is handled… |
| `/thank-you` | Thanks — DocuMind | Confirmation after recruiter inquiry… |

`metadataBase` already uses `NEXT_PUBLIC_SITE_URL` with Vercel fallback.

---

## FAQ content (five)

1. What is DocuMind?
2. What happens to my uploaded PDFs / chat history?
3. What if the shared Gemini quota is exhausted?
4. What stack powers this?
5. How can I get in touch about hiring or the project?

Exact copy to be written at implementation time; answers must match real product behavior (session TTL, B2 if configured, BYO key, etc.).

---

## Case study content (one section)

Single narrative block:

1. **Problem:** Learn RAG without treating RetrievalQA as a black box  
2. **Build:** Modular CLI → shared `rag-core` → FastAPI → Next.js demo  
3. **Result:** Live demo with streaming answers and citations  

One headline, one short support paragraph, optional 3-step list — not a card grid of marketing fluff.

---

## Edge cases & UX

- Sticky bar must not cover primary footer links; pad page bottom on mobile
- Breadcrumbs use real `<nav aria-label="Breadcrumb">` and ordered links
- Internal hash links work with sticky header offset if needed (`scroll-margin-top`)
- Form: empty submit blocked; message length soft-capped if needed for mailto URL length
- Thank-you is reachable via form flow; direct visits still show a friendly page

---

## Verification checklist

- [ ] `/#case-study`, `/#faq`, `/#contact` scroll correctly from header/footer
- [ ] Mobile sticky CTA opens demo and is absent on `/demo`
- [ ] Contact submit opens mailto (when email configured) and lands on `/thank-you`
- [ ] `/privacy` and `/thank-you` have unique titles in document head
- [ ] `/robots.txt` allows marketing pages, disallows `/app`, and points at `/sitemap.xml`
- [ ] `/sitemap.xml` lists absolute marketing URLs that return 200
- [ ] `https://<host>/google2fe32b83b8180183.html` returns 200 with verification body
- [ ] OG/Twitter preview still resolve
- [ ] No LocalBusiness / map markup shipped

---

## Non-goals reminder

This is not a lead-gen SaaS marketing rebuild. Prefer the shortest diff that makes the portfolio landing recruiter-ready and crawlable.
