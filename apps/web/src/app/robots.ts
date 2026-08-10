import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/demo", "/privacy", "/thank-you"],
      disallow: ["/app/", "/sign-in", "/sign-up", "/invite/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
