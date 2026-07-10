import { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://axiom-kanban.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/changelog", "/roadmap"],
        disallow: ["/api/", "/workspaces/", "/login", "/sign-up"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
