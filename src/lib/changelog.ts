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

// Canonical entries are `v*.md` (English). A sibling `v*.fr.md` is an
// optional French translation of the same entry, picked up when it exists.
export async function getAllChangelogEntries(
  locale: "en" | "fr" = "en"
): Promise<ChangelogEntry[]> {
  const fileNames = fs
    .readdirSync(CHANGELOG_DIR)
    .filter((f) => /^v[\d-]+\.md$/.test(f));

  const entries = await Promise.all(
    fileNames.map(async (fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const translatedPath = path.join(CHANGELOG_DIR, `${slug}.fr.md`);
      const fullPath =
        locale === "fr" && fs.existsSync(translatedPath)
          ? translatedPath
          : path.join(CHANGELOG_DIR, fileName);
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
