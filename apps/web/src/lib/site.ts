/** Canonical site origin for metadata, robots, and sitemap. */
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://trydocumind.vercel.app"
  );
}
