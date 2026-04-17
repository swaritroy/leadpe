import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE_URL = "https://leadpe.tech";

const STATIC_ROUTES = [
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/business", priority: "0.9", changefreq: "weekly" },
  { loc: "/studio", priority: "0.9", changefreq: "weekly" },
  { loc: "/about", priority: "0.6", changefreq: "monthly" },
  { loc: "/services", priority: "0.7", changefreq: "monthly" },
  { loc: "/contact", priority: "0.6", changefreq: "monthly" },
  { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
  { loc: "/terms", priority: "0.3", changefreq: "yearly" },
  { loc: "/refund", priority: "0.3", changefreq: "yearly" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  }
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: businesses } = await supabase
      .from("businesses")
      .select("slug, updated_at")
      .eq("subscription_active", true)
      .not("slug", "is", null);

    const today = new Date().toISOString().slice(0, 10);
    const urls: string[] = [];

    for (const r of STATIC_ROUTES) {
      urls.push(`<url><loc>${SITE_URL}${r.loc}</loc><lastmod>${today}</lastmod><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`);
    }

    for (const b of businesses ?? []) {
      const slug = (b as { slug: string; updated_at: string | null }).slug;
      const lastmod = (b as { updated_at: string | null }).updated_at?.slice(0, 10) ?? today;
      urls.push(`<url><loc>https://${slug}.leadpe.tech/</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response(`<!-- error: ${(e as Error).message} -->`, {
      status: 500,
      headers: { "Content-Type": "application/xml" },
    });
  }
});
