// Shared CORS helper that allows the active set of LeadPe origins:
// - leadpe.online (production custom domain)
// - *.lovable.app (published apps + id-preview-*.lovable.app)
// - *.lovableproject.com (active sandbox preview)
// - localhost (dev)

const STATIC_ALLOWED = new Set<string>([
  "https://leadpe.online",
  "https://www.leadpe.online",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
]);

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (STATIC_ALLOWED.has(origin)) return true;
  try {
    const u = new URL(origin);
    if (u.hostname.endsWith(".lovable.app")) return true;
    if (u.hostname.endsWith(".lovableproject.com")) return true;
    if (u.hostname.endsWith(".leadpe.online")) return true;
  } catch {
    /* ignore parse errors */
  }
  return false;
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = isAllowedOrigin(origin) ? origin : "https://leadpe.online";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
}
