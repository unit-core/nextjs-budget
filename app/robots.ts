import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/protected/", "/api/", "/preview/"],
      },
    ],
    sitemap: "https://budget.unitcore.io/sitemap.xml",
  }
}
