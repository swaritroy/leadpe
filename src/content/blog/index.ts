// Blog post registry — add new posts here
// Each post is a markdown file under src/content/blog/

import doctorGuide from "./doctor-website-guide.md?raw";

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  keywords: string;
  cover: string;
  readTime: string;
  raw: string;
}

function parseFrontmatter(raw: string): BlogPostMeta {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("Invalid markdown: missing frontmatter");
  const fm = match[1];
  const body = match[2];
  const data: Record<string, string> = {};
  fm.split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    data[k] = v;
  });
  return {
    slug: data.slug,
    title: data.title,
    description: data.description,
    date: data.date,
    author: data.author,
    keywords: data.keywords,
    cover: data.cover,
    readTime: data.readTime,
    raw: body,
  };
}

export const POSTS: BlogPostMeta[] = [parseFrontmatter(doctorGuide)].sort(
  (a, b) => (a.date < b.date ? 1 : -1)
);

export const getPost = (slug: string) => POSTS.find((p) => p.slug === slug);
