import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import LeadPeLogo from "@/components/LeadPeLogo";
import { POSTS } from "@/content/blog";

export default function Blog() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5FFF7" }}>
      <SEO
        title="LeadPe Blog — Website Tips India"
        description="LeadPe Blog — website tips, business growth ideas aur digital marketing advice Indian businesses ke liye. Hindi + English."
        path="/blog"
        schema={{
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "LeadPe Blog",
          "url": "https://leadpe.online/blog",
          "description": "Website tips aur business growth advice Indian businesses ke liye",
          "publisher": {
            "@type": "Organization",
            "name": "LeadPe",
            "url": "https://leadpe.online",
            "logo": { "@type": "ImageObject", "url": "https://leadpe.online/favicon.svg" }
          },
          "inLanguage": ["hi", "en-IN"]
        }}
      />

      {/* Header */}
      <header className="bg-white border-b" style={{ borderColor: "#E0E0E0" }}>
        <div className="container px-4 py-4 flex items-center justify-between">
          <Link to="/" aria-label="LeadPe home"><LeadPeLogo theme="light" size="sm" /></Link>
          <Link to="/" className="text-sm font-medium" style={{ color: "#00C853" }}>← Home</Link>
        </div>
      </header>

      <main className="flex-1 container px-4 py-12 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-3" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>
          LeadPe Blog
        </h1>
        <p className="text-base md:text-lg mb-10" style={{ color: "#666666" }}>
          Practical guides for Indian local businesses — websites, WhatsApp marketing, Google SEO, customer growth.
        </p>

        <div className="grid gap-5">
          {POSTS.map((post, i) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <Link
                to={`/blog/${post.slug}`}
                className="block bg-white rounded-2xl border p-5 md:p-6 hover:-translate-y-0.5 transition-all min-h-[48px]"
                style={{ borderColor: "#E0E0E0", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl shrink-0">{post.cover}</div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg md:text-xl font-bold mb-1.5" style={{ color: "#1A1A1A" }}>
                      {post.title}
                    </h2>
                    <p className="text-sm mb-3 line-clamp-2" style={{ color: "#666666" }}>
                      {post.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs" style={{ color: "#999999" }}>
                      <span className="inline-flex items-center gap-1"><Calendar size={12} />{post.date}</span>
                      <span className="inline-flex items-center gap-1"><Clock size={12} />{post.readTime}</span>
                      <span className="inline-flex items-center gap-1 ml-auto font-semibold" style={{ color: "#00C853" }}>
                        Read <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
