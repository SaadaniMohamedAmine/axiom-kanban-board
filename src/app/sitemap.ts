import { MetadataRoute } from "next";
import { getAllChangelogEntries } from "@/lib/changelog";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://axiom-kanban-board.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getAllChangelogEntries();
  // entries is sorted newest-first — its date is the real "last modified"
  // signal for the changelog, versus a build-time timestamp that never
  // reflects actual content changes.
  const latestChangelogDate = entries[0]?.date ? new Date(entries[0].date) : new Date();

  return [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${APP_URL}/changelog`,
      lastModified: latestChangelogDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/roadmap`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];
}
