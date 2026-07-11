import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  contentHtml: string;
  slug: string;
}

const CHANGELOG_DIR = path.join(process.cwd(), "src/content/changelog");

export async function getAllChangelogEntries(): Promise<ChangelogEntry[]> {
  const fileNames = fs.readdirSync(CHANGELOG_DIR).filter((f) => f.endsWith(".md"));

  const entries = await Promise.all(
    fileNames.map(async (fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const fullPath = path.join(CHANGELOG_DIR, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(fileContents);

      const processedContent = await remark().use(remarkHtml).process(content);

      return {
        slug,
        version: data.version as string,
        date: data.date as string,
        title: data.title as string,
        contentHtml: processedContent.toString(),
      };
    })
  );

  // Numeric comparison so "10.0.0" doesn't sort before "9.0.0" the way
  // plain string comparison would once versions reach double digits.
  return entries.sort((a, b) =>
    b.version.localeCompare(a.version, undefined, { numeric: true })
  );
}
