import { Link, useParams, Navigate } from "react-router-dom";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import LeadPeLogo from "@/components/LeadPeLogo";
import { getPost } from "@/content/blog";

// Minimal markdown → HTML (headings, lists, paragraphs, bold, links, tables)
function mdToHtml(md: string): string {
  const escape = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
  const lines = md.split("\n");
  let html = "";
  let inList = false;
  let inTable = false;

  const inline = (s: string) =>
    escape(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline" style="color:#00C853">$1</a>');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed.slice(1, -1).split("|").map((c) => c.trim());
      const isSep = cells.every((c) => /^:?-+:?$/.test(c));
      if (isSep) continue;
      if (!inTable) {
        html += '<table class="w-full my-4 border-collapse"><tbody>';
        inTable = true;
      }
      const tag = i + 1 < lines.length && /^\|[\s:-]+\|$/.test(lines[i + 1].trim()) ? "th" : "td";
      html += "<tr>" + cells.map((c) => `<${tag} class="border px-3 py-2 text-sm" style="border-color:#E0E0E0">${inline(c)}</${tag}>`).join("") + "</tr>";
      continue;
    } else if (inTable) {
      html += "</tbody></table>";
      inTable = false;
    }

    if (/^#{1,6}\s/.test(trimmed)) {
      if (inList) { html += "</ul>"; inList = false; }
      const level = trimmed.match(/^#+/)![0].length;
      const text = trimmed.replace(/^#+\s/, "");
      const sizes = ["text-3xl", "text-2xl", "text-xl", "text-lg", "text-base", "text-base"];
      html += `<h${level} class="font-bold mt-8 mb-3 ${sizes[level - 1]}" style="color:#1A1A1A;font-family:Syne,sans-serif">${inline(text)}</h${level}>`;
    } else if (/^[-*]\s/.test(trimmed)) {
      if (!inList) { html += '<ul class="list-disc pl-6 my-3 space-y-1">'; inList = true; }
      html += `<li class="text-base" style="color:#333333">${inline(trimmed.replace(/^[-*]\s/, ""))}</li>`;
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (!inList) { html += '<ol class="list-decimal pl-6 my-3 space-y-1">'; inList = true; }
      html += `<li class="text-base" style="color:#333333">${inline(trimmed.replace(/^\d+\.\s/, ""))}</li>`;
    } else if (trimmed === "") {
      if (inList) { html += "</ul>"; inList = false; }
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<p class="my-3 leading-relaxed text-base" style="color:#333333">${inline(trimmed)}</p>`;
    }
  }
  if (inList) html += "</ul>";
  if (inTable) html += "</tbody></table>";
  return html;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPost(slug) : undefined;

  if (!post) return <Navigate to="/blog" replace />;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: "LeadPe", logo: { "@type": "ImageObject", url: "https://leadpe.online/logo.png" } },
    mainEntityOfPage: `https://leadpe.online/blog/${post.slug}`,
    keywords: post.keywords,
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5FFF7" }}>
      <SEO title={post.title} description={post.description} path={`/blog/${post.slug}`} type="article" schema={articleSchema} />

      <header className="bg-white border-b" style={{ borderColor: "#E0E0E0" }}>
        <div className="container px-4 py-4 flex items-center justify-between">
          <Link to="/" aria-label="LeadPe home"><LeadPeLogo theme="light" size="sm" /></Link>
          <Link to="/blog" className="text-sm font-medium inline-flex items-center gap-1" style={{ color: "#00C853" }}>
            <ArrowLeft size={14} /> All posts
          </Link>
        </div>
      </header>

      <main className="flex-1 container px-4 py-10 max-w-3xl mx-auto">
        <article className="bg-white rounded-2xl p-6 md:p-10 border" style={{ borderColor: "#E0E0E0", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <div className="text-5xl mb-4">{post.cover}</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-xs mb-8 pb-6 border-b" style={{ color: "#999999", borderColor: "#E0E0E0" }}>
            <span className="inline-flex items-center gap-1"><Calendar size={12} />{post.date}</span>
            <span className="inline-flex items-center gap-1"><Clock size={12} />{post.readTime}</span>
            <span className="ml-auto">By {post.author}</span>
          </div>
          <div dangerouslySetInnerHTML={{ __html: mdToHtml(post.raw) }} />
        </article>
      </main>

      <Footer />
    </div>
  );
}
