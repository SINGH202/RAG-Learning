/** Canonical site origin for metadata, robots, and sitemap. */
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://trydocumind.vercel.app"
  );
}

/** Public contact details for the portfolio / recruiter inquiry UI. */
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ||
  "apk.anurag.singh@gmail.com";

/** Indian mobile; `tel:` uses E.164. */
export const CONTACT_PHONE_DISPLAY = "88749 40467";
export const CONTACT_PHONE_E164 = "+918874940467";
