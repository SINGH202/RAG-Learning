import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/demo", "/privacy"],
      disallow: ["/app/", "/sign-in", "/sign-up", "/invite/", "/thank-you"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
